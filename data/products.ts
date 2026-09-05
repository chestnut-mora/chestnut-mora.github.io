export type Product = {
  id: string;
  caption: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  instagramUrl: string;
  featured: boolean;
  accent: string;
};

export const products: Product[] = [
  {
    id: 'instagram-post-03',
    caption: '粉色的喜歡',
    image: '/assets/instagram/post-03.jpg',
    width: 1080,
    height: 1350,
    alt: '紫粉色串珠與角色公仔組成的手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/Dc5wUKoHRYi/',
    featured: true,
    accent: 'pink',
  },
  {
    id: 'instagram-post-04',
    caption: '柔柔的亮光',
    image: '/assets/instagram/post-04.jpg',
    width: 1080,
    height: 1350,
    alt: '粉色串珠與角色公仔在花朵旁的手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/Dc5ULxnndDA/',
    featured: true,
    accent: 'blush',
  },
  {
    id: 'instagram-post-05',
    caption: '彩虹的一天',
    image: '/assets/instagram/post-05.jpg',
    width: 1080,
    height: 1350,
    alt: '繽紛彩色珠珠與角色公仔組成的手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/Dc3Mgj2HQSv/',
    featured: true,
    accent: 'sage',
  },
  {
    id: 'instagram-post-06',
    caption: '甜甜的櫻桃',
    image: '/assets/instagram/post-06.jpg',
    width: 1080,
    height: 1350,
    alt: '粉色透明珠珠與角色公仔組成的手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/Dc0lbPEHdeE/',
    featured: true,
    accent: 'pink',
  },
  {
    id: 'instagram-post-07',
    caption: '綠意與橘色',
    image: '/assets/instagram/post-07.jpg',
    width: 1080,
    height: 1350,
    alt: '綠色與橘色串珠和角色公仔組成的手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/Dcx_mOlne1f/',
    featured: true,
    accent: 'forest',
  },
  {
    id: 'instagram-post-08',
    caption: '晚安小夜空',
    image: '/assets/instagram/post-08.jpg',
    width: 1080,
    height: 1350,
    alt: '藍綠色串珠與角色公仔組成的夜晚氛圍手作萌栗',
    instagramUrl: 'https://www.instagram.com/chestnut_mora/p/DcvT1rWHVrv/',
    featured: true,
    accent: 'night',
  },
];
