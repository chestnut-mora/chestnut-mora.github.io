import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MYSHIP_CONFIG, hasUnavailableNameSignal } from './myship-config.mjs';
import { buildMyShipStats, mergeProductLifecycle, MYSHIP_LIFECYCLE_STATUSES } from './myship-lifecycle.mjs';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = resolve(ROOT_DIR, 'public/data/myship-products.json');
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = 'ChestnutMoraMyShipSync/1.0 (+https://chestnut-mora.github.io/)';

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function getField(record, names) {
  if (!record || typeof record !== 'object') return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(record, name)) return record[name];
    const match = Object.keys(record).find((key) => key.toLowerCase() === name.toLowerCase());
    if (match) return record[match];
  }
  return undefined;
}

function asTrimmedString(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function cleanVariantName(value) {
  return asTrimmedString(value).replace(/\s*(?:無庫存|无库存)\s*$/u, '').trim();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function getStock(spec) {
  const rawStock = getField(spec, ['Inventory', 'Cgds_Inventory', 'inventory', 'stock', 'quantity', 'qty']);
  const stock = parseNumber(rawStock);
  if (stock !== null) return stock;
  const name = asTrimmedString(getField(spec, ['Cgds_Spec', 'spec', 'name']));
  return hasUnavailableNameSignal(name) ? 0 : null;
}

function getSelectability(spec) {
  const disabled = getField(spec, [
    'Disabled',
    'disabled',
    'IsDisabled',
    'isDisabled',
    'Unavailable',
    'unavailable',
    'IsUnavailable',
    'isUnavailable',
    'Cgds_Disabled',
    'Cgds_IsDisabled',
  ]);
  if (disabled === true || /^(?:1|true|yes|不可選|不可选|disabled|unavailable)$/iu.test(String(disabled ?? ''))) return false;

  const selectable = getField(spec, [
    'Selectable',
    'selectable',
    'IsSelectable',
    'isSelectable',
    'Available',
    'available',
    'IsAvailable',
    'isAvailable',
    'Cgds_Selectable',
    'Cgds_IsSelectable',
    'Cgds_Available',
  ]);
  if (selectable === false || /^(?:0|false|no|不可選|不可选|disabled|unavailable)$/iu.test(String(selectable ?? ''))) return false;
  if (selectable === true || /^(?:1|true|yes|可選|可选|available)$/iu.test(String(selectable ?? ''))) return true;

  const status = getField(spec, ['Status', 'status', 'State', 'state', 'Cgds_Status', 'Cgds_State']);
  if (typeof status === 'string' && /不可選|不可选|售罄|缺貨|缺货|unavailable|sold\s*out|disabled/iu.test(status)) return false;
  return null;
}

function getStatus(stock, selectable) {
  if (selectable === false) return 'soldout';
  if (stock === null) return 'unknown';
  if (stock > 0) return 'available';
  if (stock === 0) return 'soldout';
  return 'unknown';
}

function makeImageUrl(imagePath, storeId) {
  const rawPath = asTrimmedString(imagePath);
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) {
    try {
      return new URL(rawPath).toString();
    } catch {
      return null;
    }
  }

  const path = rawPath.replace(/^\/+/, '').split('/').map((part) => encodeURIComponent(part)).join('/');
  return `${MYSHIP_CONFIG.imageBaseUrl}/i/cgdm/${encodeURIComponent(storeId)}/${path}`;
}

function stableId(storeId, sourceVariantName) {
  return `myship-${createHash('sha256').update(`${storeId}:${sourceVariantName}`).digest('hex').slice(0, 16)}`;
}

function extractEmbeddedProducts(html) {
  const products = [];
  const pattern = /data-product\s*=\s*(["'])(.*?)\1/gis;
  for (const match of html.matchAll(pattern)) {
    const encoded = decodeHtmlEntities(match[2]);
    try {
      const parsed = JSON.parse(encoded);
      if (parsed && Array.isArray(getField(parsed, ['Spec', 'spec']))) products.push(parsed);
    } catch {
      // The page can contain unrelated data attributes; skip non-JSON values.
    }
  }
  return products;
}

function normalizeProducts(rawProducts, syncedAt) {
  const normalized = [];
  const seen = new Set();

  for (const product of rawProducts) {
    const storeId = asTrimmedString(getField(product, ['Cgdd_Cgdmid', 'Cgdmid', 'storeId'])) || MYSHIP_CONFIG.storeId;
    const productId = asTrimmedString(getField(product, ['Cgdd_Id', 'productId', 'id'])) || null;
    const specs = getField(product, ['Spec', 'spec']) || [];

    for (const spec of specs) {
      const sourceVariantName = asTrimmedString(getField(spec, ['Cgds_Spec', 'spec', 'name', 'variantName']));
      if (!sourceVariantName) continue;
      const name = cleanVariantName(sourceVariantName);
      const id = stableId(storeId, sourceVariantName);
      if (seen.has(id)) continue;
      seen.add(id);

      const selectable = getSelectability(spec);
      const stock = getStock(spec);
      const status = getStatus(stock, selectable);
      const regularPrice = parseNumber(getField(spec, ['Cgds_Price', 'price', 'regularPrice']));
      const salePrice = parseNumber(getField(spec, ['Cgds_SPrice', 'salePrice', 'specialPrice']));
      const imagePath = getField(spec, ['Cgds_CgimImagePath', 'imagePath', 'image', 'imageUrl']);
      const sourceImageUrl = makeImageUrl(imagePath, storeId);

      normalized.push({
        id,
        name,
        price: salePrice !== null && salePrice > 0 ? salePrice : regularPrice,
        image: sourceImageUrl,
        sourceImageUrl,
        sourceVariantName,
        sourceUrl: MYSHIP_CONFIG.sourceUrl,
        deepLink: null,
        status,
        syncedAt,
        productId,
        variantId: asTrimmedString(getField(spec, ['Cgds_Id', 'variantId', 'specId'])) || null,
        specId: asTrimmedString(getField(spec, ['Cgds_Id', 'specId', 'variantId'])) || null,
        skuId: asTrimmedString(getField(spec, ['Cgds_SkuId', 'skuId', 'sku'])) || null,
        excluded: status === 'unknown',
        ...(status === 'unknown' ? { exclusionReason: selectable === false ? 'unselectable' : 'unknown-stock' } : {}),
      });
    }
  }

  return normalized;
}

function validateDataset(dataset) {
  if (!dataset || !Array.isArray(dataset.products) || dataset.products.length === 0) {
    throw new Error('validation failed: no product variants were parsed');
  }
  const allowedStatuses = new Set(MYSHIP_LIFECYCLE_STATUSES);
  const ids = new Set();
  for (const product of dataset.products) {
    if (!product.id || ids.has(product.id)) throw new Error('validation failed: duplicate or missing stable product id');
    if (!product.name || !product.sourceVariantName || !allowedStatuses.has(product.status)) {
      throw new Error(`validation failed: incomplete product ${product.id || '<unknown>'}`);
    }
    ids.add(product.id);
  }
}

async function fetchSourceHtml() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(MYSHIP_CONFIG.sourceUrl, {
      headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function readLastGoodDataset() {
  try {
    const content = await readFile(OUTPUT_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) return parsed;
  } catch {
    // No previous valid snapshot is available.
  }
  return null;
}

function comparableDataset(dataset) {
  return {
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    stats: dataset.stats,
    products: dataset.products.map(({ syncedAt: _syncedAt, ...product }) => product),
  };
}

async function main() {
  const previous = await readLastGoodDataset();

  try {
    const html = await fetchSourceHtml();
    const embeddedProducts = extractEmbeddedProducts(html);
    if (embeddedProducts.length === 0) throw new Error('no embedded MyShip product data found');

    const syncedAt = new Date().toISOString();
    const incomingProducts = normalizeProducts(embeddedProducts, syncedAt);
    const products = mergeProductLifecycle(previous?.products || [], incomingProducts, syncedAt);
    const stats = buildMyShipStats(products);
    const dataset = {
      source: MYSHIP_CONFIG.source,
      sourceUrl: MYSHIP_CONFIG.sourceUrl,
      syncedAt,
      stats,
      products,
    };
    validateDataset(dataset);

    if (previous && JSON.stringify(comparableDataset(previous)) === JSON.stringify(comparableDataset(dataset))) {
      console.log(JSON.stringify({ output: OUTPUT_PATH, changed: false, stats, syncedAt: previous.syncedAt }, null, 2));
      return;
    }

    await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ output: OUTPUT_PATH, changed: true, stats, syncedAt }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (previous) {
      console.error(`MyShip sync failed; keeping previous valid JSON: ${message}`);
    } else {
      console.error(`MyShip sync failed; no JSON was written: ${message}`);
    }
    process.exitCode = 1;
  }
}

await main();
