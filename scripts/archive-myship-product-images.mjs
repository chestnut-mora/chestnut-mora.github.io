import { isIP } from 'node:net';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { MYSHIP_CONFIG } from './myship-config.mjs';
import { writeSeoAssets } from './seo-assets.mjs';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_PATH = resolve(ROOT_DIR, 'public/data/myship-products.json');

export const PRODUCT_ARCHIVE_DIR = resolve(ROOT_DIR, 'public/assets/products');
export const PRODUCT_ARCHIVE_PUBLIC_ROOT = '/assets/products';
export const ARCHIVE_WEBP_QUALITY = 84;
export const ARCHIVE_WEBP_EFFORT = 6;
export const ARCHIVE_WEBP_ALPHA_QUALITY = 90;
export const MAX_REMOTE_IMAGE_BYTES = 15 * 1024 * 1024;

const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = 'ChestnutMoraMyShipArchive/1.0 (+https://chestnut-mora.github.io/)';
const ALLOWED_REMOTE_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_SOURCE_FORMATS = new Set(['jpeg', 'png', 'webp']);
const ALLOWED_IMAGE_HOSTNAMES = new Set([new URL(MYSHIP_CONFIG.imageBaseUrl).hostname.toLowerCase()]);

function isPrivateIpv4(hostname) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [first, second] = octets;
  return first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}

function isPrivateHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (['localhost', 'localhost.localdomain', '0.0.0.0'].includes(normalized)) return true;

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) return normalized === '::1' || normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd');
  return false;
}

export function isValidProductSlug(slug) {
  return typeof slug === 'string' && /^mori-\d{6}-\d{3}$/u.test(slug);
}

export function getProductArchivePublicPath(slug) {
  if (!isValidProductSlug(slug)) return null;
  return `${PRODUCT_ARCHIVE_PUBLIC_ROOT}/${slug}.webp`;
}

function getProductArchiveFilePath(slug) {
  if (!isValidProductSlug(slug)) return null;
  return resolve(PRODUCT_ARCHIVE_DIR, `${slug}.webp`);
}

export function validateRemoteImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('missing remote image URL');

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('invalid remote image URL');
  }

  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:') throw new Error(`remote image protocol is not HTTPS: ${url.protocol}`);
  if (url.username || url.password || (url.port && url.port !== '443')) throw new Error('remote image URL contains credentials or a non-standard port');
  if (isPrivateHostname(hostname)) throw new Error('private network image URL is not allowed');
  if (!ALLOWED_IMAGE_HOSTNAMES.has(hostname)) throw new Error(`remote image hostname is not allowlisted: ${hostname}`);

  return url;
}

function getSourceImageUrl(product) {
  if (typeof product?.sourceImageUrl === 'string' && product.sourceImageUrl.trim()) return product.sourceImageUrl;
  if (typeof product?.image === 'string' && /^https?:\/\//iu.test(product.image)) return product.image;
  return null;
}

async function readResponseBuffer(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error(`remote image exceeds ${MAX_REMOTE_IMAGE_BYTES} bytes`);
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_REMOTE_IMAGE_BYTES) throw new Error(`remote image exceeds ${MAX_REMOTE_IMAGE_BYTES} bytes`);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REMOTE_IMAGE_BYTES) throw new Error(`remote image exceeds ${MAX_REMOTE_IMAGE_BYTES} bytes`);
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

async function fetchRemoteImage(sourceUrl) {
  const requestedUrl = validateRemoteImageUrl(sourceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestedUrl, {
      headers: {
        accept: 'image/jpeg,image/png,image/webp',
        'user-agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`remote image returned HTTP ${response.status}`);

    const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
    if (!ALLOWED_REMOTE_IMAGE_MIME_TYPES.has(contentType)) throw new Error(`unsupported remote image MIME type: ${contentType || 'missing'}`);

    const finalUrl = validateRemoteImageUrl(response.url || requestedUrl.toString());
    const buffer = await readResponseBuffer(response);
    const metadata = await validateImageBuffer(buffer);

    return {
      buffer,
      metadata,
      sourceUrl: finalUrl.toString(),
      mimeType: contentType,
      originalBytes: buffer.byteLength,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateImageBuffer(buffer) {
  const metadata = await sharp(buffer).metadata();
  const format = String(metadata.format || '').toLowerCase();
  if (!ALLOWED_SOURCE_FORMATS.has(format)) throw new Error(`unsupported decoded image format: ${format || 'unknown'}`);
  if (!metadata.width || !metadata.height) throw new Error('decoded image has invalid dimensions');
  return {
    format,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: metadata.hasAlpha === true,
  };
}

export async function validateArchiveFile(filePath) {
  const metadata = await sharp(filePath).metadata();
  const fileInfo = await stat(filePath);
  if (String(metadata.format || '').toLowerCase() !== 'webp') throw new Error('archive is not WebP');
  if (!metadata.width || !metadata.height) throw new Error('archive has invalid dimensions');
  return {
    format: 'webp',
    width: metadata.width,
    height: metadata.height,
    bytes: fileInfo.size,
  };
}

function calculateSavedPercent(originalBytes, webpBytes) {
  if (!originalBytes) return 0;
  return Number((((originalBytes - webpBytes) / originalBytes) * 100).toFixed(1));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function fallbackProductImage(product, sourceImageUrl) {
  return {
    ...product,
    image: sourceImageUrl || product.sourceImageUrl || null,
  };
}

export async function archiveProductImage(product, { force = false } = {}) {
  const publicPath = getProductArchivePublicPath(product?.slug);
  const filePath = getProductArchiveFilePath(product?.slug);
  if (!publicPath || !filePath) {
    return {
      product: fallbackProductImage(product, getSourceImageUrl(product)),
      outcome: 'failed',
      error: 'missing or invalid product slug',
    };
  }

  let existingArchiveIsInvalid = false;
  if (!force) {
    try {
      const archive = await validateArchiveFile(filePath);
      return {
        product: { ...product, image: publicPath },
        outcome: 'already-archived',
        archive,
      };
    } catch {
      existingArchiveIsInvalid = true;
    }
  }

  const sourceImageUrl = getSourceImageUrl(product);
  if (!sourceImageUrl) {
    return {
      product: fallbackProductImage(product, null),
      outcome: 'failed',
      error: 'no MyShip source image URL',
    };
  }

  let temporaryPath = null;
  try {
    const remoteImage = await fetchRemoteImage(sourceImageUrl);
    const outputBuffer = await sharp(remoteImage.buffer)
      .webp({
        quality: ARCHIVE_WEBP_QUALITY,
        effort: ARCHIVE_WEBP_EFFORT,
        alphaQuality: ARCHIVE_WEBP_ALPHA_QUALITY,
      })
      .toBuffer();
    const outputMetadata = await validateImageBuffer(outputBuffer);
    if (outputMetadata.format !== 'webp') throw new Error('Sharp did not produce WebP');
    if (outputMetadata.width !== remoteImage.metadata.width || outputMetadata.height !== remoteImage.metadata.height) {
      throw new Error('WebP dimensions do not match the source image');
    }

    await mkdir(PRODUCT_ARCHIVE_DIR, { recursive: true });
    temporaryPath = resolve(PRODUCT_ARCHIVE_DIR, `.${product.slug}.${process.pid}.${randomUUID()}.tmp.webp`);
    await writeFile(temporaryPath, outputBuffer);
    const archive = {
      format: 'webp',
      width: outputMetadata.width,
      height: outputMetadata.height,
      bytes: outputBuffer.byteLength,
    };

    if (existingArchiveIsInvalid) await rm(filePath, { force: true });
    await rename(temporaryPath, filePath);
    temporaryPath = null;

    return {
      product: { ...product, image: publicPath },
      outcome: force ? 'replaced' : 'newly-archived',
      report: {
        slug: product.slug,
        sourceFormat: remoteImage.metadata.format,
        originalWidth: remoteImage.metadata.width,
        originalHeight: remoteImage.metadata.height,
        originalBytes: remoteImage.originalBytes,
        webpWidth: archive.width,
        webpHeight: archive.height,
        webpBytes: archive.bytes,
        quality: ARCHIVE_WEBP_QUALITY,
        savedPercent: calculateSavedPercent(remoteImage.originalBytes, archive.bytes),
      },
    };
  } catch (error) {
    return {
      product: fallbackProductImage(product, sourceImageUrl),
      outcome: 'failed',
      error: errorMessage(error),
    };
  } finally {
    if (temporaryPath) await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function summarizeCompression(records) {
  const originalBytes = records.map((record) => record.originalBytes);
  const webpBytes = records.map((record) => record.webpBytes);
  const totalOriginalBytes = originalBytes.reduce((sum, value) => sum + value, 0);
  const totalWebpBytes = webpBytes.reduce((sum, value) => sum + value, 0);
  const byLargest = [...records].sort((left, right) => right.webpBytes - left.webpBytes);
  const bySmallest = [...records].sort((left, right) => left.webpBytes - right.webpBytes);

  return {
    newlyArchivedCount: records.length,
    averageOriginalBytes: records.length ? Math.round(totalOriginalBytes / records.length) : 0,
    averageWebpBytes: records.length ? Math.round(totalWebpBytes / records.length) : 0,
    medianWebpBytes: median(webpBytes),
    averageSavingPercent: totalOriginalBytes ? Number((((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100).toFixed(1)) : 0,
    largestWebp: byLargest[0] ? { slug: byLargest[0].slug, bytes: byLargest[0].webpBytes } : null,
    smallestWebp: bySmallest[0] ? { slug: bySmallest[0].slug, bytes: bySmallest[0].webpBytes } : null,
    largeWebpOver350KB: records.filter((record) => record.webpBytes > 350 * 1024).map((record) => ({ slug: record.slug, bytes: record.webpBytes })),
    records,
  };
}

export async function getArchiveStorageReport() {
  let names = [];
  try {
    names = await readdir(PRODUCT_ARCHIVE_DIR);
  } catch {
    return {
      archiveCount: 0,
      totalBytes: 0,
      averageBytes: 0,
      medianBytes: 0,
      largest: null,
      smallest: null,
      estimatedBytes: { 500: 0, 1000: 0, 3000: 0, 4000: 0 },
    };
  }

  const archives = [];
  for (const name of names.filter((entry) => /^mori-\d{6}-\d{3}\.webp$/u.test(entry))) {
    const filePath = resolve(PRODUCT_ARCHIVE_DIR, name);
    try {
      const fileInfo = await stat(filePath);
      archives.push({ slug: name.slice(0, -5), bytes: fileInfo.size });
    } catch {
      // Ignore a file that disappears during a concurrent local operation.
    }
  }

  const bytes = archives.map((archive) => archive.bytes);
  const totalBytes = bytes.reduce((sum, value) => sum + value, 0);
  const averageBytes = archives.length ? Math.round(totalBytes / archives.length) : 0;
  const sorted = [...archives].sort((left, right) => left.bytes - right.bytes);
  const largest = sorted.at(-1) || null;
  const smallest = sorted[0] || null;
  return {
    archiveCount: archives.length,
    totalBytes,
    averageBytes,
    medianBytes: median(bytes),
    largest,
    smallest,
    estimatedBytes: {
      500: averageBytes * 500,
      1000: averageBytes * 1000,
      3000: averageBytes * 3000,
      4000: averageBytes * 4000,
    },
  };
}

export function summarizeArchiveReport(report) {
  return {
    productsScanned: report.productsScanned,
    imagesAlreadyArchived: report.imagesAlreadyArchived,
    imagesNewlyArchived: report.imagesNewlyArchived,
    imagesFailed: report.imagesFailed,
    imagesUsingMyShipFallback: report.imagesUsingMyShipFallback,
    compression: {
      newlyArchivedCount: report.compression.newlyArchivedCount,
      averageOriginalBytes: report.compression.averageOriginalBytes,
      averageWebpBytes: report.compression.averageWebpBytes,
      medianWebpBytes: report.compression.medianWebpBytes,
      averageSavingPercent: report.compression.averageSavingPercent,
      largestWebp: report.compression.largestWebp,
      smallestWebp: report.compression.smallestWebp,
      largeWebpOver350KB: report.compression.largeWebpOver350KB,
    },
    storage: report.storage,
  };
}

export async function archiveMissingProductImages(products, { force = false, slugs = null } = {}) {
  const selectedSlugs = slugs ? new Set(slugs) : null;
  const nextProducts = [];
  const compressionRecords = [];
  const failures = [];
  let imagesAlreadyArchived = 0;
  let imagesNewlyArchived = 0;

  for (const product of products) {
    if (selectedSlugs && !selectedSlugs.has(product.slug)) {
      nextProducts.push(product);
      continue;
    }

    const result = await archiveProductImage(product, { force });
    nextProducts.push(result.product);
    if (result.outcome === 'already-archived') imagesAlreadyArchived += 1;
    if (result.outcome === 'newly-archived' || result.outcome === 'replaced') {
      imagesNewlyArchived += 1;
      if (result.report) compressionRecords.push(result.report);
    }
    if (result.outcome === 'failed') failures.push({ slug: product.slug || null, name: product.name || null, error: result.error });
  }

  const imagesUsingMyShipFallback = nextProducts.filter((product) => typeof product.image === 'string' && /^https?:\/\//iu.test(product.image)).length;
  const storage = await getArchiveStorageReport();
  const report = {
    productsScanned: products.length,
    imagesAlreadyArchived,
    imagesNewlyArchived,
    imagesFailed: failures.length,
    imagesUsingMyShipFallback,
    failures,
    compression: summarizeCompression(compressionRecords),
    storage,
  };

  return { products: nextProducts, report };
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugs = args.filter((arg) => arg !== '--force');
  return { force, slugs: slugs.length ? slugs : null };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { force, slugs } = parseCliArgs();
  const dataset = JSON.parse(await readFile(PRODUCTS_PATH, 'utf8'));
  const previousProducts = dataset.products || [];
  const archiveResult = await archiveMissingProductImages(previousProducts, { force, slugs });
  const nextDataset = await writeSeoAssets({ ...dataset, products: archiveResult.products }, { previousProducts });
  await writeFile(PRODUCTS_PATH, `${JSON.stringify(nextDataset, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ ...summarizeArchiveReport(archiveResult.report), failures: archiveResult.report.failures }, null, 2));
  if (archiveResult.report.imagesFailed > 0) process.exitCode = 1;
}
