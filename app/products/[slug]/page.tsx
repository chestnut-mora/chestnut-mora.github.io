/* oxlint-disable next/no-img-element, next/no-html-link-for-pages */

import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { MyShipProductImage } from '@/components/myship-product-image';
import {
  BRAND_NAME,
  BRAND_NAME_ZH,
  buildProductJsonLd,
  getProductBySlug,
  getProductDescriptionForMetadata,
  getPreferredProductImageAbsolute,
  getProductStatusLabel,
  getProductUrl,
  getShopUrl,
  myShipSeoProducts,
  serializeJsonLd,
} from '@/data/seo';
import { social } from '@/data/social';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return myShipSeoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const productUrl = getProductUrl(product);
  const productImage = getPreferredProductImageAbsolute(product);
  const productTitle = product.status === 'available'
    ? `${product.name}｜泡泡瑪特 POP MART 萌粒手機鍊｜${BRAND_NAME_ZH} ${BRAND_NAME}`
    : `${product.name}｜絕版泡泡瑪特 POP MART 萌粒手機鍊｜${BRAND_NAME_ZH} ${BRAND_NAME}`;
  return {
    title: productTitle,
    description: getProductDescriptionForMetadata(product),
    alternates: { canonical: productUrl },
    openGraph: {
      title: productTitle,
      description: getProductDescriptionForMetadata(product),
      type: 'website',
      url: productUrl,
      ...(productImage ? { images: [{ url: productImage, alt: `${product.name} 角色萌粒手機鍊與手作配件商品圖片` }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle,
      description: getProductDescriptionForMetadata(product),
      ...(productImage ? { images: [productImage] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const isAvailable = product.status === 'available';
  const isSoldOut = product.status === 'soldout';
  const shopUrl = getShopUrl(product);

  return (
    <div className="product-page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildProductJsonLd(product)) }} />
      <header className="product-page-header">
        <a className="product-page-brand" href="/" aria-label="回到栗子森林首頁">
          <span className="product-page-brand-name">{BRAND_NAME_ZH}</span>
          <span className="product-page-brand-english">{BRAND_NAME.toUpperCase()}</span>
        </a>
        <a className="product-page-instagram" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
          Instagram <ArrowUpRight size={15} strokeWidth={1.8} />
        </a>
      </header>

      <main className="product-page-main">
        <a className="product-page-back" href="/products/">
          <ArrowLeft size={16} strokeWidth={1.8} /> 回到所有萌栗
        </a>
        <section className="product-detail-hero" aria-labelledby="product-title">
          <div className="product-detail-media">
            <MyShipProductImage product={product} alt={`${product.name} 角色萌粒手機鍊與手作配件商品圖片`} loading="eager" />
          </div>
          <div className="product-detail-copy">
            <p className={`product-status product-status-${product.status}`}>{getProductStatusLabel(product.status)}</p>
            <h1 id="product-title">{product.name}</h1>
            <p className="product-detail-lede">{isAvailable ? '把喜歡的角色，和手作搭配一起帶進每天的日常。' : '每一條萌栗都有自己的相遇時刻，謝謝你來看看它。'}</p>

            <div className="product-detail-meta">
              {product.price !== null && (isAvailable || isSoldOut) ? <span>NT${product.price.toLocaleString('zh-TW')}</span> : null}
              <span>{getProductStatusLabel(product.status)}</span>
            </div>

            {isAvailable ? (
              <a className="product-detail-primary" href={shopUrl} target="_blank" rel="noopener noreferrer">
                前往 7-11 賣貨便 <ArrowUpRight size={17} strokeWidth={1.8} />
              </a>
            ) : (
              <a className="product-detail-primary product-detail-secondary" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                到 Instagram 找栗子森林 <ArrowUpRight size={17} strokeWidth={1.8} />
              </a>
            )}

            <p className="product-detail-note">
              {isAvailable
                ? '實際庫存與下單方式，以官方賣貨便頁面為準。'
                : '想詢問相似搭配或之後的新萌栗，歡迎到 Instagram 找我們聊聊。'}
            </p>
          </div>
        </section>

        <section className="product-detail-story" aria-label="萌栗介紹">
          <p className="eyebrow">CHESTNUT MORA</p>
          <p>栗子森林以正版角色為主角，慢慢挑選珠珠、鍊條與小配件，做出一條條有自己個性的萌栗。</p>
          <a href="/">回到栗子森林首頁 <ArrowUpRight size={15} strokeWidth={1.8} /></a>
        </section>
      </main>
    </div>
  );
}
