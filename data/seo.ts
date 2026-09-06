import dataset from './myship-seo.json';
import { faqItems } from './faq';
import type { MyShipProductStatus } from './myship';

export const SITE_ORIGIN = 'https://chestnut-mora.github.io';
export const BRAND_NAME = 'Chestnut Mora';
export const BRAND_NAME_ZH = '栗子森林';
export const PRODUCT_SCHEMA_CATEGORY = '4550';

export type SeoProduct = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  image: string | null;
  sourceImageUrl: string | null;
  sourceUrl: string;
  deepLink: string | null;
  status: MyShipProductStatus;
  productId: string | null;
  variantId: string | null;
  specId: string | null;
  skuId: string | null;
};

export const myShipSeoProducts = dataset.products as SeoProduct[];

export function getProductUrl(product: SeoProduct) {
  return `${SITE_ORIGIN}/products/${product.slug}`;
}

export function getShopUrl(product: SeoProduct) {
  return product.deepLink || product.sourceUrl;
}

export function getProductStatusLabel(status: MyShipProductStatus) {
  switch (status) {
    case 'available':
      return '現貨萌栗';
    case 'soldout':
      return '已售出／目前無庫存';
    case 'removed':
      return '歷代萌栗／已下架';
    case 'archived':
      return '歷代萌栗／已售出作品';
    default:
      return '萌栗收藏';
  }
}

function getProductDescription(product: SeoProduct) {
  if (product.status === 'available') {
    return `「${product.name}」是栗子森林以正版角色搭配串珠、鍊條與小配件完成的萌粒手機鍊；在栗子森林，我們稱它們為「萌栗」，適合掛在手機或包包上，成為日常裡的小收藏。`;
  }
  if (product.status === 'soldout') {
    return `「${product.name}」是栗子森林曾經製作的萌粒手機鍊，目前已經被喜愛它的主人收養；在栗子森林，我們稱為「萌栗」，我們將其保留在森林裡作為一份值得收藏的手作記錄。`;
  }
  return `「${product.name}」是栗子森林曾經製作的萌粒手機鍊，目前已經被喜愛它的主人收養；在栗子森林，我們稱為「萌栗」，我們將其保留在森林裡作為一份值得收藏的手作記錄。`;
}

function buildOffer(product: SeoProduct) {
  if (product.status !== 'available' && product.status !== 'soldout') return null;

  return {
    '@type': 'Offer',
    url: getShopUrl(product),
    priceCurrency: 'TWD',
    ...(product.price === null ? {} : { price: product.price }),
    availability: product.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: BRAND_NAME,
    },
  };
}

export function buildProductJsonLd(product: SeoProduct) {
  const productUrl = getProductUrl(product);
  const offer = buildOffer(product);
  const productNode = {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    url: productUrl,
    description: getProductDescription(product),
    ...(product.image ? { image: [product.image] } : {}),
    sku: product.skuId || product.variantId || product.specId || product.id,
    ...(product.variantId ? { identifier: product.variantId } : {}),
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    category: PRODUCT_SCHEMA_CATEGORY,
    material: '串珠、鍊條與角色配件',
    ...(offer ? { offers: offer } : {}),
    ...(product.status === 'removed' || product.status === 'archived'
      ? {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: '商品生命週期',
            value: getProductStatusLabel(product.status),
          },
        }
      : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      productNode,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: BRAND_NAME_ZH, item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: '所有萌栗', item: `${SITE_ORIGIN}/products/` },
          { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
        ],
      },
    ],
  };
}

export function buildHomepageJsonLd() {
  const availableProducts = myShipSeoProducts.filter((product) => product.status === 'available');
  const productNodes = availableProducts.map((product) => buildProductJsonLd(product)['@graph'][0]);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: BRAND_NAME,
        alternateName: BRAND_NAME_ZH,
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/assets/brand/logo-brown.png`,
        sameAs: ['https://www.instagram.com/chestnut_mora/'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: `${BRAND_NAME_ZH} ${BRAND_NAME}`,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        inLanguage: 'zh-Hant',
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/products/#item-list`,
        url: `${SITE_ORIGIN}/products/`,
        name: '所有萌栗',
        numberOfItems: availableProducts.length,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        itemListElement: availableProducts.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: { '@id': `${getProductUrl(product)}#product` },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_ORIGIN}/#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer.join('\n\n'),
          },
        })),
      },
      ...productNodes,
    ],
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

export function getProductBySlug(slug: string) {
  return myShipSeoProducts.find((product) => product.slug === slug) || null;
}

export function getProductDescriptionForMetadata(product: SeoProduct) {
  return getProductDescription(product);
}
