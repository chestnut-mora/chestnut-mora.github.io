import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_PATH = resolve(ROOT_DIR, 'public/data/myship-products.json');
const SEO_PRODUCTS_PATH = resolve(ROOT_DIR, 'data/myship-seo.json');
const SITEMAP_PATH = resolve(ROOT_DIR, 'public/sitemap.xml');

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

export function assignProductSlugs(products) {
  const usedSlugs = new Set();
  const seeded = products.map((product) => {
    if (isValidSlug(product.slug) && !usedSlugs.has(product.slug)) {
      usedSlugs.add(product.slug);
      return { ...product };
    }
    const { slug: _slug, ...withoutSlug } = product;
    return withoutSlug;
  });
  const counters = new Map();

  return seeded.map((product) => {
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
    return { ...product, slug };
  });
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
  };
}

export function projectSeoDataset(dataset) {
  const products = assignProductSlugs(dataset.products || []);
  return {
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    products: products.map(projectProduct),
  };
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
  const urls = [
    { loc: `${SITE_ORIGIN}/`, changefreq: 'daily', priority: '1.0' },
    ...products
      .filter((product) => isValidSlug(product.slug))
      .map((product) => ({ loc: `${SITE_ORIGIN}/products/${product.slug}`, changefreq: 'weekly', priority: '0.7' })),
  ];

  const entries = urls
    .map(({ loc, changefreq, priority }) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export async function writeSeoAssets(dataset) {
  const products = assignProductSlugs(dataset.products || []);
  const nextDataset = { ...dataset, products };
  const seoDataset = projectSeoDataset(nextDataset);

  await writeFile(SEO_PRODUCTS_PATH, `${JSON.stringify(seoDataset, null, 2)}\n`, 'utf8');
  await writeFile(SITEMAP_PATH, buildSitemap(products), 'utf8');
  return nextDataset;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const dataset = JSON.parse(await readFile(PRODUCTS_PATH, 'utf8'));
  const nextDataset = await writeSeoAssets(dataset);
  await writeFile(PRODUCTS_PATH, `${JSON.stringify(nextDataset, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ products: nextDataset.products.length, output: SEO_PRODUCTS_PATH, sitemap: SITEMAP_PATH }, null, 2));
}
