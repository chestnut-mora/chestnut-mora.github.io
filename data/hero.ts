export type HeroImage = {
  id: string;
  image: string;
  width: number;
  height: number;
  alt: string;
};

// These files are direct copies of the approved originals in the local brand folder.
// The hero intentionally uses the complete image-led set, not the MyShip dataset.
const originalHeroImages: HeroImage[] = [
  {
    id: 'hero-image-01',
    image: '/assets/lifestyle/lifestyle-pool.png',
    width: 1086,
    height: 1448,
    alt: '手持藍色珠珠萌栗手機鍊，背景是陽光下的水面與手機',
  },
  {
    id: 'hero-image-02',
    image: '/assets/lifestyle/lifestyle-lavender.png',
    width: 1122,
    height: 1402,
    alt: '紫色花朵與粉紫色萌粒手機鍊掛在白色包包上',
  },
  {
    id: 'hero-image-03',
    image: '/assets/lifestyle/lifestyle-macaron.png',
    width: 1122,
    height: 1402,
    alt: '粉色甜點場景裡的手作萌粒手機鍊',
  },
  {
    id: 'hero-image-04',
    image: '/assets/details/detail-pink.png',
    width: 1080,
    height: 1350,
    alt: '粉色珠珠、花朵與角色組成的萌粒手機鍊細節',
  },
  {
    id: 'hero-image-05',
    image: '/assets/products/product-sweet.png',
    width: 1080,
    height: 1350,
    alt: '柔和甜色系珠珠與角色組成的手作萌粒手機鍊',
  },
  {
    id: 'hero-image-06',
    image: '/assets/products/product-color.png',
    width: 1080,
    height: 1350,
    alt: '繽紛彩色珠珠與角色組成的手作萌粒手機鍊',
  },
  {
    id: 'hero-image-07',
    image: '/assets/details/detail-night.png',
    width: 1080,
    height: 1350,
    alt: '夜晚色調的角色與珠珠萌粒手機鍊細節',
  },
  {
    id: 'hero-image-08',
    image: '/assets/products/product-night.png',
    width: 1080,
    height: 1350,
    alt: '藍綠色珠珠與夜空氛圍組成的手作萌粒手機鍊',
  },
  {
    id: 'hero-image-09',
    image: '/assets/hero/hero-forest.png',
    width: 1080,
    height: 1350,
    alt: '兩只編織包上掛著暖色角色萌粒手機鍊，場景在戶外果園裡',
  },
  {
    id: 'hero-image-10',
    image: '/assets/products/product-blue.png',
    width: 1080,
    height: 1350,
    alt: '藍色透明珠珠與角色組成的手作萌粒手機鍊',
  },
  {
    id: 'hero-image-11',
    image: '/assets/products/product-purple.png',
    width: 1080,
    height: 1350,
    alt: '紫色花朵場景裡的手作萌粒手機鍊',
  },
];

const instagramCarouselImageSizes: Record<string, readonly [number, number]> = {
  '13': [1122, 1402],
  '22': [1092, 1440],
  '26': [1092, 1440],
  '27': [1086, 1448],
};

const instagramCarouselImages: HeroImage[] = Array.from({ length: 28 }, (_, index) => {
  const postNumber = String(index + 3).padStart(2, '0');
  const [width, height] = instagramCarouselImageSizes[postNumber] ?? [1080, 1350];
  return {
    id: `instagram-post-${postNumber}`,
    image: `/assets/instagram/post-${postNumber}.jpg`,
    width,
    height,
    alt: `栗子森林 Instagram 貼文 ${postNumber} 的萌粒手機鍊與日常圖片`,
  };
});

export const heroImages: HeroImage[] = [...originalHeroImages, ...instagramCarouselImages];
