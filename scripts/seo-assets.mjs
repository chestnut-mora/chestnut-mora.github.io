import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_PATH = resolve(ROOT_DIR, 'public/data/myship-products.json');
const SEO_PRODUCTS_PATH = resolve(ROOT_DIR, 'data/myship-seo.json');
const SITEMAP_PATH = resolve(ROOT_DIR, 'public/sitemap.xml');
const SLUG_REGISTRY_PATH = resolve(ROOT_DIR, 'data/product-slug-registry.json');
const SEO_REVISION_PATH = resolve(ROOT_DIR, 'data/seo-revision.json');

export const SITE_ORIGIN = 'https://chestnut-mora.github.io';

function dateTokenForProduct(product) {
  const sourceId = String(product.variantId || product.specId || product.skuId || '');
  const sourceDate = sourceId.match(/^\d{6}/)?.[0];
  if (sourceDate) return sourceDate;

  const syncedTime = Date.parse(product.syncedAt || '');
  if (Number.isFinite(syncedTime)) {
    const date = new Date(syncedTime);
    return [String(date.getUTCFullYear()).slice(-2), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0')].join('');
  }

  return '000000';
}

function isValidSlug(value) {
  return typeof value === 'string' && /^mori-\d{6}-\d{3}$/u.test(value);
}

function productIdentity(product) {
  const sourceKey = product.variantId || product.specId || product.skuId;
  if (sourceKey) return `source:${product.productId || ''}:${sourceKey}`;
  return `id:${product.id}`;
}

async function readSlugRegistry() {
  try {
    const parsed = JSON.parse(await readFile(SLUG_REGISTRY_PATH, 'utf8'));
    if (parsed && Array.isArray(parsed.entries)) return { version: 1, entries: parsed.entries };
  } catch {
    // The first sync creates the registry from the existing product snapshot.
  }
  return { version: 1, entries: [] };
}

async function readSeoRevision() {
  try {
    const parsed = JSON.parse(await readFile(SEO_REVISION_PATH, 'utf8'));
    if (parsed && typeof parsed.version === 'string' && parsed.version.trim()) return parsed.version.trim();
  } catch {
    // Keep a deterministic fallback for older checkouts.
  }
  return '1';
}

export function assignProductSlugs(products, registry = { version: 1, entries: [] }) {
  const entriesByIdentity = new Map(
    registry.entries
      .filter((entry) => entry && typeof entry.identity === 'string' && isValidSlug(entry.slug))
      .map((entry) => [entry.identity, entry.slug]),
  );
  const slugOwners = new Map(Array.from(entriesByIdentity.entries()).map(([identity, slug]) => [slug, identity]));
  const usedSlugs = new Set(entriesByIdentity.values());
  const seeded = products.map((product) => {
    const identity = productIdentity(product);
    const registeredSlug = entriesByIdentity.get(identity);
    const sourceSlug = isValidSlug(product.slug) ? product.slug : null;
    const sourceSlugOwner = sourceSlug ? slugOwners.get(sourceSlug) : null;
    const slug = registeredSlug || (sourceSlug && (!sourceSlugOwner || sourceSlugOwner === identity) ? sourceSlug : null);

    if (slug) {
      entriesByIdentity.set(identity, slug);
      slugOwners.set(slug, identity);
      usedSlugs.add(slug);
      return { ...product, slug };
    }

    const { slug: _slug, ...withoutSlug } = product;
    return withoutSlug;
  });
  const counters = new Map();

  const assigned = seeded.map((product) => {
    if (isValidSlug(product.slug)) return product;

    const dateToken = dateTokenForProduct(product);
    let sequence = counters.get(dateToken) || 1;
    let slug = `mori-${dateToken}-${String(sequence).padStart(3, '0')}`;
    while (usedSlugs.has(slug)) {
      sequence += 1;
      slug = `mori-${dateToken}-${String(sequence).padStart(3, '0')}`;
    }
    counters.set(dateToken, sequence + 1);
    usedSlugs.add(slug);
    entriesByIdentity.set(productIdentity(product), slug);
    slugOwners.set(slug, productIdentity(product));
    return { ...product, slug };
  });

  registry.entries = Array.from(entriesByIdentity.entries())
    .map(([identity, slug]) => ({ identity, slug }))
    .sort((left, right) => left.slug.localeCompare(right.slug));

  return assigned;
}

function projectProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price ?? null,
    image: product.image ?? product.sourceImageUrl ?? null,
    sourceImageUrl: product.sourceImageUrl ?? null,
    sourceUrl: product.sourceUrl,
    deepLink: product.deepLink ?? null,
    status: product.status,
    productId: product.productId ?? null,
    variantId: product.variantId ?? null,
    specId: product.specId ?? null,
    skuId: product.skuId ?? null,
    lastmod: product.lastmod ?? null,
  };
}

export function projectSeoDataset(dataset) {
  const products = dataset.products || [];
  return {
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    products: products.map(projectProduct),
  };
}

function toLastmod(value) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

export function productSeoFingerprint(product) {
  return JSON.stringify({
    slug: product.slug || null,
    name: product.name || null,
    price: product.price ?? null,
    image: product.image ?? null,
    sourceImageUrl: product.sourceImageUrl ?? null,
    sourceUrl: product.sourceUrl || null,
    deepLink: product.deepLink ?? null,
    status: product.status || null,
    productId: product.productId ?? null,
    variantId: product.variantId ?? null,
    specId: product.specId ?? null,
    skuId: product.skuId ?? null,
  });
}

export function applyProductLastModified(previousProducts, products, syncedAt, seoRevision) {
  const previousById = new Map(previousProducts.map((product) => [product.id, product]));
  const fallbackLastmod = toLastmod(syncedAt);

  return products.map((product) => {
    const previous = previousById.get(product.id);
    const hasSeoChange = !previous
      || !previous.lastmod
      || previous.seoRevision !== seoRevision
      || productSeoFingerprint(previous) !== productSeoFingerprint(product);

    return {
      ...product,
      lastmod: hasSeoChange ? fallbackLastmod : previous.lastmod,
      seoRevision,
    };
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemap(products) {
  const validProducts = products.filter((product) => isValidSlug(product.slug));
  const availableProducts = validProducts.filter((product) => product.status === 'available');
  const latestLastmod = (items) => items.map((product) => product.lastmod).filter(Boolean).sort().at(-1) || null;
  const urls = [
    { loc: `${SITE_ORIGIN}/`, lastmod: latestLastmod(availableProducts) },
    { loc: `${SITE_ORIGIN}/products/`, lastmod: latestLastmod(validProducts) },
    ...validProducts.map((product) => ({ loc: `${SITE_ORIGIN}/products/${product.slug}`, lastmod: product.lastmod || null })),
  ];

  const entries = urls
    .map(({ loc, lastmod }) => `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export async function writeSeoAssets(dataset, { previousProducts = [] } = {}) {
  const registry = await readSlugRegistry();
  const assignedProducts = assignProductSlugs(dataset.products || [], registry);
  const seoRevision = await readSeoRevision();
  const products = applyProductLastModified(previousProducts, assignedProducts, dataset.syncedAt, seoRevision);
  const nextDataset = { ...dataset, products };
  const seoDataset = projectSeoDataset(nextDataset);

  await writeFile(SLUG_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  await writeFile(SEO_PRODUCTS_PATH, `${JSON.stringify(seoDataset, null, 2)}\n`, 'utf8');
  await writeFile(SITEMAP_PATH, buildSitemap(products), 'utf8');
  return nextDataset;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const dataset = JSON.parse(await readFile(PRODUCTS_PATH, 'utf8'));
  const nextDataset = await writeSeoAssets(dataset, { previousProducts: dataset.products || [] });
  await writeFile(PRODUCTS_PATH, `${JSON.stringify(nextDataset, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ products: nextDataset.products.length, output: SEO_PRODUCTS_PATH, sitemap: SITEMAP_PATH }, null, 2));
}
