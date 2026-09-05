export type MyShipProductStatus = 'available' | 'soldout' | 'unknown';

export type MyShipProduct = {
  id: string;
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
  excluded: boolean;
  exclusionReason?: string;
};

export type MyShipDataset = {
  source: string;
  sourceUrl: string;
  syncedAt: string;
  stats: {
    totalVariants: number;
    available: number;
    soldout: number;
    excluded: number;
    withImage: number;
    withoutImage: number;
  };
  products: MyShipProduct[];
};

export const MYSHIP_PRODUCTS_PATH = '/data/myship-products.json';
