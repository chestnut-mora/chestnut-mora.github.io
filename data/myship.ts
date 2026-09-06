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
