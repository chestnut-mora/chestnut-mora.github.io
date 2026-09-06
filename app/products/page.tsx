/* oxlint-disable next/no-img-element, next/no-html-link-for-pages */

import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { BRAND_NAME, BRAND_NAME_ZH, getProductStatusLabel, getProductUrl, getShopUrl, myShipSeoProducts, serializeJsonLd, SITE_ORIGIN } from '@/data/seo';
import { social } from '@/data/social';

export const metadata: Metadata = {
  title: '所有萌栗｜泡泡瑪特 POP MART 萌粒手機鍊｜栗子森林 Chestnut Mora',
  description: '查看栗子森林目前的萌粒手機鍊，以及曾經製作過、被喜愛它的主人收養的歷代萌栗作品。',
  alternates: { canonical: '/products/' },
  openGraph: {
    title: '所有萌栗｜栗子森林 Chestnut Mora',
    description: '目前萌栗與歷代萌栗作品，記錄每一次只遇見一次的手作搭配。',
    type: 'website',
    url: '/products/',
  },
};

const cardTones = ['pink', 'blush', 'sage', 'forest', 'lavender', 'night'] as const;

function ProductIndexCard({ product, index }: { product: (typeof myShipSeoProducts)[number]; index: number }) {
  const isAvailable = product.status === 'available';
  const detailUrl = `/products/${product.slug}`;
  const tone = cardTones[index % cardTones.length];

  return (
    <article className={`product-card product-index-card product-card-${tone}`} data-product-status={product.status}>
      <a className="product-image-wrap" href={detailUrl} aria-label={`查看${product.name}商品頁`}>
        {product.image ? <img src={product.image} alt={`手作 ${product.name} 萌粒手機鍊商品圖片`} loading="lazy" decoding="async" /> : <span className="product-image-fallback">栗子森林</span>}
        <span className="product-badge">{getProductStatusLabel(product.status)}</span>
      </a>
      <div className="product-card-body">
        <h2><a href={detailUrl}>{product.name}</a></h2>
        <div className="product-card-footer">
          <span className="product-price">
            {isAvailable && product.price !== null ? `NT$${product.price.toLocaleString('zh-TW')}` : isAvailable ? '價格請見賣貨便' : '歷代作品'}
          </span>
          {isAvailable ? (
            <a href={getShopUrl(product)} target="_blank" rel="noopener noreferrer">
              前往賣貨便 <ArrowUpRight size={15} strokeWidth={1.8} />
            </a>
          ) : (
            <a href={detailUrl}>
              查看作品 <ArrowUpRight size={15} strokeWidth={1.8} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const currentProducts = myShipSeoProducts.filter((product) => product.status === 'available');
  const historicalProducts = myShipSeoProducts.filter((product) => ['soldout', 'removed', 'archived'].includes(product.status));
  const items = [...currentProducts, ...historicalProducts];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_ORIGIN}/products/#collection`,
        url: `${SITE_ORIGIN}/products/`,
        name: '所有萌栗｜目前萌栗與歷代萌栗作品',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: BRAND_NAME_ZH, item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: '所有萌栗', item: `${SITE_ORIGIN}/products/` },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_ORIGIN}/products/#item-list`,
        name: '所有萌栗',
        numberOfItems: items.length,
        itemListElement: items.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: getProductUrl(product),
          item: { '@id': `${getProductUrl(product)}#product`, name: product.name },
        })),
      },
    ],
  };

  return (
    <div className="product-page-shell product-index-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
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
        <nav className="product-index-breadcrumb" aria-label="麵包屑導覽">
          <a href="/">首頁</a>
          <span aria-hidden="true">/</span>
          <span>所有萌栗</span>
        </nav>
        <div className="product-index-heading">
          <p className="eyebrow">CHESTNUT MORA · COLLECTION</p>
          <h1>所有萌栗</h1>
          <p>把現在可以遇見的萌栗，和曾經在森林裡生活過的作品，放在同一頁慢慢逛。</p>
        </div>

        <section className="product-index-section" aria-labelledby="current-products-title">
          <div className="product-index-section-heading">
            <div>
              <p className="eyebrow">NOW IN THE FOREST</p>
              <h2 id="current-products-title">目前萌栗</h2>
            </div>
            <a className="product-index-back" href="/"><ArrowLeft size={15} strokeWidth={1.8} /> 回到首頁</a>
          </div>
          {currentProducts.length > 0 ? (
            <div className="product-index-grid">
              {currentProducts.map((product, index) => <ProductIndexCard key={product.id} product={product} index={index} />)}
            </div>
          ) : <p className="collection-state">新的萌栗正在整理中 ♡</p>}
        </section>

        <section className="product-index-section" aria-labelledby="historical-products-title">
          <div className="product-index-section-heading">
            <div>
              <p className="eyebrow">FROM THE FOREST ARCHIVE</p>
              <h2 id="historical-products-title">歷代萌栗作品</h2>
            </div>
          </div>
          {historicalProducts.length > 0 ? (
            <div className="product-index-grid">
              {historicalProducts.map((product, index) => <ProductIndexCard key={product.id} product={product} index={currentProducts.length + index} />)}
            </div>
          ) : <p className="collection-state">還沒有被收進森林檔案的作品。</p>}
        </section>
      </main>
    </div>
  );
}
