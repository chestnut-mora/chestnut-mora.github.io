export type MyShipProductStatus = 'available' | 'soldout' | 'removed' | 'archived' | 'unknown';

export type MyShipProduct = {
  id: string;
  slug?: string;
  name: string;
  price: number | null;
  image: string | null;
  sourceImageUrl: string | null;
  sourceVariantName: string;
  sourceUrl: string;
  deepLink: string | null;
  status: MyShipProductStatus;
  syncedAt: string;
  productId: string | null;
  variantId: string | null;
  specId: string | null;
  skuId: string | null;
  lastmod?: string | null;
  seoRevision?: string;
  excluded: boolean;
  exclusionReason?: string;
  missingSince?: string | null;
  removedAt?: string;
  archivedAt?: string;
};

export type MyShipDataset = {
  source: string;
  sourceUrl: string;
  syncedAt: string;
  stats: {
    totalVariants: number;
    available: number;
    soldout: number;
    removed: number;
    archived: number;
    unknown: number;
    excluded: number;
    withImage: number;
    withoutImage: number;
  };
  products: MyShipProduct[];
};

export const MYSHIP_PRODUCTS_PATH = '/data/myship-products.json';

type DatedProduct = {
  slug?: string | null;
  variantId?: string | null;
  specId?: string | null;
  skuId?: string | null;
  syncedAt?: string | null;
  id?: string | null;
};

function getPublishedDateToken(product: DatedProduct) {
  const slugMatch = String(product.slug || '').match(/^mori-(\d{6})-(\d{3})$/u);
  if (slugMatch) return { date: slugMatch[1], sequence: Number(slugMatch[2]) };

  for (const sourceId of [product.variantId, product.specId, product.skuId]) {
    const dateMatch = String(sourceId || '').match(/^(\d{6})/u);
    if (dateMatch) return { date: dateMatch[1], sequence: 0 };
  }

  return { date: '000000', sequence: 0 };
}

/**
 * Keep the public current-product order aligned with the site's upload-date
 * convention. Product slugs are persistent and begin with the YYMMDD token
 * assigned from the MyShip variant id; the suffix preserves same-day order.
 */
export function sortProductsByPublishedDate<T extends DatedProduct>(products: T[]) {
  return [...products].sort((left, right) => {
    const leftKey = getPublishedDateToken(left);
    const rightKey = getPublishedDateToken(right);
    const dateOrder = rightKey.date.localeCompare(leftKey.date);
    if (dateOrder !== 0) return dateOrder;

    const sequenceOrder = rightKey.sequence - leftKey.sequence;
    if (sequenceOrder !== 0) return sequenceOrder;

    const rightSynced = Date.parse(right.syncedAt || '') || 0;
    const leftSynced = Date.parse(left.syncedAt || '') || 0;
    if (rightSynced !== leftSynced) return rightSynced - leftSynced;
    return String(left.slug || left.id || '').localeCompare(String(right.slug || right.id || ''));
  });
}
