'use client';

/* oxlint-disable next/no-img-element */

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Gem,
  Heart,
  Leaf,
  Menu,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { faqItems } from '@/data/faq';
import { heroImages } from '@/data/hero';
import { navigation } from '@/data/navigation';
import { MYSHIP_PRODUCTS_PATH, type MyShipDataset, type MyShipProduct } from '@/data/myship';
import { buildHomepageJsonLd, serializeJsonLd } from '@/data/seo';
import { social } from '@/data/social';
import { AvalUnboxingHero } from '@/components/aval-unboxing-hero';

const trustItems = [
  { label: '正版角色', icon: ShieldCheck },
  { label: '手工搭配', icon: Sparkles },
  { label: '小量製作', icon: Gem },
  { label: '用心包裝', icon: PackageCheck },
  { label: '售後服務', icon: Heart },
] as const;

const currentYear = new Date().getFullYear();

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <div className="section-description">{description}</div> : null}
    </div>
  );
}

function InstagramMark({ size, tone = 'brown' }: { size: number; tone?: 'brown' | 'light' }) {
  const source = tone === 'light' ? '/assets/brand/instagram-icon-light.png' : '/assets/brand/instagram-icon-brown.png';
  return <Image className="instagram-mark" src={source} alt="" width={size} height={size} />;
}

const myShipCardTones = ['pink', 'blush', 'sage', 'forest', 'lavender', 'night'] as const;

function formatSyncTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function MyShipProductCard({ product, index }: { product: MyShipProduct; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const productUrl = product.deepLink ?? product.sourceUrl;
  const productDetailUrl = product.slug ? `/products/${product.slug}` : productUrl;
  const tone = myShipCardTones[index % myShipCardTones.length];

  return (
    <article
      className={`product-card product-card-${tone}`}
      data-product-name={product.name}
      data-product-status={product.status}
    >
      <a className="product-image-wrap" href={productDetailUrl} aria-label={`查看${product.name}商品頁`}>
        {imageFailed || !product.image ? (
          <span className="product-image-fallback" aria-hidden="true">
            <Image src="/assets/brand/logo-brown.png" alt="" width={360} height={360} />
          </span>
        ) : (
          <img
            src={product.image}
            alt={`${product.name} 萌栗商品圖片`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
      </a>
      <div className="product-card-body">
        <h3><a href={productDetailUrl}>{product.name}</a></h3>
        <div className="product-card-footer">
          <span className="product-price">
            {product.price === null ? '價格請見賣貨便' : `NT$${product.price.toLocaleString('zh-TW')}`}
          </span>
          <a href={productUrl} target="_blank" rel="noopener noreferrer" aria-label={`帶${product.name}回家`}>
            帶它回家 <ArrowUpRight size={15} strokeWidth={1.8} />
          </a>
        </div>
      </div>
    </article>
  );
}

function ProductSkeleton({ index }: { index: number }) {
  const tone = myShipCardTones[index % myShipCardTones.length];
  return (
    <article className={`product-card product-card-${tone} collection-skeleton`} aria-hidden="true">
      <div className="collection-skeleton-image" />
      <div className="product-card-body">
        <span className="collection-skeleton-line collection-skeleton-line-title" />
        <span className="collection-skeleton-line collection-skeleton-line-meta" />
      </div>
    </article>
  );
}

function HeroImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    let enableTransition = 0;
    const randomize = window.setTimeout(() => {
      setActiveIndex(Math.floor(Math.random() * heroImages.length));
      enableTransition = window.requestAnimationFrame(() => setIsInitializing(false));
    }, 0);
    return () => {
      window.clearTimeout(randomize);
      if (enableTransition) window.cancelAnimationFrame(enableTransition);
    };
  }, []);

  useEffect(() => {
    if (isPaused || heroImages.length < 2) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % heroImages.length);
    }, 3500);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPaused]);

  const moveToAdjacentImage = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + heroImages.length) % heroImages.length);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    pointerStartX.current = event.clientX;
    suppressClick.current = false;
    setDragOffset(0);
    setIsDragging(true);
    setIsPaused(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const startX = pointerStartX.current;
    if (startX === null) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const distance = event.clientX - startX;
    setDragOffset(Math.max(-bounds.width, Math.min(bounds.width, distance)));
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    setIsDragging(false);
    setIsPaused(false);
    if (startX === null) return;

    const distance = event.clientX - startX;
    const didSwipe = Math.abs(distance) >= 36;
    suppressClick.current = didSwipe;
    setDragOffset(0);
    if (didSwipe) moveToAdjacentImage(distance < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    setIsDragging(false);
    setDragOffset(0);
    setIsPaused(false);
  };

  const handleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    moveToAdjacentImage(1);
  };

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    moveToAdjacentImage(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setIsPaused(false);
    moveToAdjacentImage(event.key === 'ArrowLeft' ? -1 : 1);
  };

  return (
    <button
      type="button"
      className="hero-media image-reveal"
      aria-roledescription="carousel"
      aria-label="栗子森林形象圖片輪播，左鍵下一張、右鍵上一張，可左右滑動或使用左右方向鍵切換"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="hero-carousel-viewport">
        <div
          className="hero-carousel-track"
          style={{
            transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
            transition: isDragging || isInitializing ? 'none' : undefined,
          }}
        >
          {heroImages.map((slide, index) => (
            <div className="hero-carousel-slide" key={slide.id} aria-hidden={index !== activeIndex}>
              <Image
                src={slide.image}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showStickyCta, setShowStickyCta] = useState(true);
  const [myShipProducts, setMyShipProducts] = useState<MyShipProduct[]>([]);
  const [myShipLoadState, setMyShipLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [myShipSyncedAt, setMyShipSyncedAt] = useState<string | null>(null);
  const [showAllMyShipProducts, setShowAllMyShipProducts] = useState(false);
  const productScrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('#site-footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0.12 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scroller = productScrollerRef.current;
    if (!scroller) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const canMove = event.deltaY > 0 ? scroller.scrollLeft < maxScroll - 1 : scroller.scrollLeft > 1;
      if (!canMove) return;
      event.preventDefault();
      scroller.scrollBy({ left: event.deltaY * 1.15, behavior: 'smooth' });
    };

    scroller.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scroller.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(MYSHIP_PRODUCTS_PATH, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`MyShip JSON returned HTTP ${response.status}`);
        return (await response.json()) as MyShipDataset;
      })
      .then((dataset) => {
        if (cancelled || !Array.isArray(dataset.products)) return;
        setMyShipProducts(dataset.products.filter((product) => product.status === 'available'));
        setMyShipSyncedAt(dataset.syncedAt ?? null);
        setShowAllMyShipProducts(false);
        setMyShipLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setMyShipProducts([]);
        setMyShipLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const visibleMyShipProducts = showAllMyShipProducts ? myShipProducts : myShipProducts.slice(0, 12);

  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomepageJsonLd()) }} />
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand-lockup" href="#top" onClick={closeMenu} aria-label="回到栗子森林首頁">
            <span className="brand-mark" aria-hidden="true">
              <Image src="/assets/brand/logo-brown.png" alt="" width="1080" height="1080" />
            </span>
            <span className="brand-copy">
              <span className="brand-name">栗子森林</span>
              <span className="brand-english">CHESTNUT MORA</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="主要導覽">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.shortLabel}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <a
              className="icon-button instagram-button"
              href={social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="在 Instagram 查看栗子森林"
            >
              <InstagramMark size={20} />
            </a>
            <a
              className="icon-button shop-button"
              href={social.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="前往 7-11 賣貨便"
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
            </a>
            <button
              className="icon-button menu-button"
              type="button"
              aria-label={menuOpen ? '關閉選單' : '開啟選單'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        <nav className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-label="手機版導覽">
          <div className="container mobile-menu-inner">
            {navigation.map((item, index) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                <span>0{index + 1}</span>
                {item.label}
                <ArrowUpRight size={17} strokeWidth={1.7} />
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main id="top">
        <AvalUnboxingHero />

        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-inner">
            <HeroImageCarousel />

            <div className="hero-card fade-up">
              <div className="hero-kicker">
                <span>栗子森林</span>
                <span>CHESTNUT MORA</span>
              </div>
              <h1 id="hero-title">
                <span className="hero-title-line">把喜歡的小角色，</span>
                <br />
                <span className="hero-title-line">掛進每天的日常。</span>
              </h1>
              <p className="hero-lede">
                正版角色 × 手作搭配
                <br />
                <span>
                  每一條萌栗，
                  <br />
                  都有自己的小小世界。
                </span>
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                  逛逛最新萌栗
                  <ArrowRight size={18} strokeWidth={1.8} />
                </a>
                <a className="text-link" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                  Follow @chestnut_mora
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </a>
              </div>
              <div className="hero-footnote">
                <Sparkles size={15} strokeWidth={1.6} />
                <span>A Small Charm,<br />A Brighter Day.</span>
              </div>
            </div>
          </div>
          <a className="hero-scroll" href="#about" aria-label="往下探索栗子森林">
            <span>scroll to explore</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </section>

        <section id="about" className="section intro-section">
          <div className="container intro-layout">
            <SectionHeading
              eyebrow="WELCOME TO CHESTNUT FOREST"
              title={
                <>
                  這裡住著一群
                  <br />
                  可愛的小收藏。
                </>
              }
            />
            <div className="intro-copy">
              <p>栗子森林 Chestnut Mora 是一個喜歡角色、串珠與日常小物的手作品牌。</p>
              <p>我們把喜歡的角色，搭配不同顏色、珠珠與配件，慢慢做成一條一條屬於自己的「萌栗」。</p>
              <p>希望這些小小的收藏，能陪你走進每一個值得喜歡的日常。</p>
              <a className="text-link" href="#mengli">
                走進萌栗的小森林 <ArrowRight size={16} strokeWidth={1.8} />
              </a>
              <figure className="intro-photo image-reveal">
                <Image
                  src="/assets/lifestyle/lifestyle-macaron.png"
                  alt="粉色甜點場景裡的手作萌栗"
                  width="1122"
                  height="1402"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>一件小收藏，陪你走進值得喜歡的日常。</figcaption>
              </figure>
            </div>
          </div>
          <div className="container intro-decoration" aria-hidden="true">
            <span className="decor-star">✦</span>
            <span className="decor-line" />
            <span className="decor-copy">one of a kind</span>
            <span className="decor-bead" />
          </div>
        </section>

        <section id="mengli" className="section promise-section">
          <div className="container">
            <SectionHeading
              eyebrow="ABOUT MENG-LI"
              title={
                <>
                  什麼是「萌栗」？
                  <span className="title-note">萌萌的角色，住進一條手作小世界。</span>
                </>
              }
              description="不只是一條手機鍊，也是可以每天帶出門的小收藏。"
            />
            <div className="promise-grid">
              <article className="promise-card promise-card-pink">
                <div className="promise-icon"><ShieldCheck size={22} strokeWidth={1.6} /></div>
                <span className="promise-number">01</span>
                <h3>正版角色</h3>
                <p>以正版角色為萌栗的主角，讓喜歡可以安心收藏。</p>
              </article>
              <article className="promise-card promise-card-sage">
                <div className="promise-icon"><Sparkles size={22} strokeWidth={1.6} /></div>
                <span className="promise-number">02</span>
                <h3>手工搭配</h3>
                <p>從角色、珠珠、配件到整體配色，由栗子森林慢慢組合。</p>
              </article>
              <article className="promise-card promise-card-cream">
                <div className="promise-icon"><Star size={22} strokeWidth={1.6} /></div>
                <span className="promise-number">03</span>
                <h3>小量收藏</h3>
                <p>每一次搭配都有自己的個性，有些喜歡，也許只有這一次相遇。</p>
              </article>
            </div>
          </div>
        </section>

        <section id="collection" className="section collection-section">
          <div className="container">
            <div className="section-heading-row">
              <SectionHeading
                eyebrow="TODAY'S PICKS"
                title={<>今天想帶哪一條出門？</>}
                description="每一條萌栗，都把喜歡的角色與手作搭配放進日常。"
              />
              <a className="desktop-text-link" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                查看最新貼文 <ArrowUpRight size={16} strokeWidth={1.8} />
              </a>
            </div>

            <section
              ref={productScrollerRef}
              id="myship-product-scroller"
              className="product-scroller"
              aria-label="目前有庫存的萌栗商品，左右滑動查看"
              aria-busy={myShipLoadState === 'loading'}
            >
              {myShipLoadState === 'loading' ? (
                Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={`skeleton-${index}`} index={index} />)
              ) : myShipLoadState === 'error' || myShipProducts.length === 0 ? (
                <p className="collection-state">萌栗們正在整理森林中 ♡</p>
              ) : (
                visibleMyShipProducts.map((product, index) => <MyShipProductCard key={product.id} product={product} index={index} />)
              )}
            </section>
            {myShipLoadState === 'ready' && visibleMyShipProducts.length > 1 ? (
              <p className="scroll-hint"><ArrowRight size={15} strokeWidth={1.5} /> 左右滑動探索更多</p>
            ) : null}
            {myShipLoadState === 'ready' && myShipProducts.length > 12 ? (
              <div className="collection-expand-wrap">
                <button
                  className="collection-expand-button"
                  type="button"
                  aria-expanded={showAllMyShipProducts}
                  aria-controls="myship-product-scroller"
                  onClick={() => setShowAllMyShipProducts((current) => !current)}
                >
                  {showAllMyShipProducts ? '收起卡片' : `所有萌栗（${myShipProducts.length}）`}
                  <ChevronDown className={showAllMyShipProducts ? 'collection-expand-icon is-expanded' : 'collection-expand-icon'} size={17} strokeWidth={1.8} />
                </button>
              </div>
            ) : null}
            {myShipLoadState === 'ready' && myShipSyncedAt && formatSyncTime(myShipSyncedAt) ? (
              <p className="sync-note">同步於 {formatSyncTime(myShipSyncedAt)}</p>
            ) : null}
          </div>
        </section>

        <section id="lifestyle" className="section lifestyle-section">
          <div className="container">
            <div className="lifestyle-heading">
              <SectionHeading
                eyebrow="LIFE WITH MENG-LI"
                title={
                  <>
                    萌栗，
                    <br />
                    陪你去很多地方。
                  </>
                }
                description="上班、上課、旅行、喝咖啡，每一個平凡時刻，都可以多一點喜歡。"
              />
              <div className="lifestyle-note">
                <Leaf size={20} strokeWidth={1.4} />
                <span>made for ordinary days</span>
              </div>
            </div>
            <div className="lifestyle-layout">
              <figure className="lifestyle-feature image-reveal">
                <Image
                  src="/assets/lifestyle/lifestyle-pool.png"
                  alt="手持藍色珠珠萌栗手機鍊，背景是陽光下的水面與手機"
                  width="1086"
                  height="1448"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>一點顏色，讓日常亮起來。</figcaption>
              </figure>
              <div className="lifestyle-stack">
                <figure className="lifestyle-small lifestyle-small-lavender image-reveal">
                  <Image
                    src="/assets/lifestyle/lifestyle-lavender.png"
                    alt="紫色花朵與粉紫色萌栗掛在白色包包上"
                    width="1122"
                    height="1402"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>把喜歡帶去花開的地方。</figcaption>
                </figure>
                <figure className="lifestyle-small lifestyle-small-forest image-reveal">
                  <Image
                    src="/assets/hero/hero-forest.png"
                    alt="兩只編織包與暖色角色萌栗在戶外果園裡"
                    width="1080"
                    height="1350"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>掛在包包上，也掛住今天的好心情。</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section id="details" className="section detail-section" aria-label="萌栗細節">
          <div className="container detail-layout">
            <div className="detail-copy">
              <SectionHeading
                eyebrow="LITTLE DETAILS"
                title={
                  <>
                    喜歡，
                    <br />
                    藏在每一個小細節裡。
                  </>
                }
              />
              <div className="detail-copy-list">
                <div>
                  <span>精選串珠</span>
                  <p>每一顆，都替整條萌栗增加一點個性。</p>
                </div>
                <div>
                  <span>角色主角</span>
                  <p>每一條萌栗，都從喜歡的角色開始。</p>
                </div>
                <div>
                  <span>質感配件</span>
                  <p>讓小細節也值得靠近看。</p>
                </div>
                <div>
                  <span>日常掛法</span>
                  <p>好看，也要能陪你每天出門。</p>
                </div>
              </div>
              <div className="detail-rule"><span /><span /><span /></div>
            </div>
            <div className="detail-images">
              <figure className="detail-image image-reveal">
                <Image
                  src="/assets/details/detail-pink.png"
                  alt="粉色珠珠、花朵配件與角色公仔的萌栗細節"
                  width="1080"
                  height="1350"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="detail-image image-reveal">
                <Image
                  src="/assets/products/product-blue.png"
                  alt="透明與藍色珠珠組成的萌栗配色細節"
                  width="1080"
                  height="1350"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="detail-image image-reveal">
                <Image
                  src="/assets/products/product-color.png"
                  alt="繽紛珠珠與雙角色小配件的萌栗細節"
                  width="1080"
                  height="1350"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="detail-image image-reveal">
                <Image
                  src="/assets/details/detail-night.png"
                  alt="夜晚氛圍中的角色、珠珠與掛點細節"
                  width="1080"
                  height="1350"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </section>

        <section id="story" className="section story-section">
          <div className="container story-layout">
            <div className="story-copy">
              <p className="eyebrow eyebrow-light">A LITTLE STORY</p>
              <h2>每一條萌栗，<br />都有自己的小小世界。</h2>
              <p>有時候，從一個喜歡的角色開始。</p>
              <p>有時候，是先遇見了一種漂亮的顏色。</p>
              <p>把角色、珠珠和小配件慢慢放在一起，直到它變成一條讓人想每天帶著出門的萌栗。</p>
              <p>這就是栗子森林每天在做的事情。</p>
              <div className="handwritten">made with ♡<br />in Chestnut Forest</div>
            </div>
            <div className="story-aside">
              <Image
                src="/assets/brand/logo-banner.png"
                alt="MORI 三顆栗子角色 Logo"
                width="3000"
                height="834"
                loading="lazy"
                decoding="async"
              />
              <div className="story-aside-caption">
                <span>small studio</span>
                <span>big little feelings</span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-to-buy" className="section how-section">
          <div className="container">
            <SectionHeading
              eyebrow="HOW TO BUY"
              title={<>找到喜歡的萌栗之後</>}
              description="喜歡的萌栗，從 Instagram 開始逛。"
            />
            <div className="steps-grid">
              <article className="step-card">
                <span className="step-number">01</span>
                <InstagramMark size={24} />
                <h3>前往 Instagram</h3>
                <p>看看最新貼文與日常。</p>
              </article>
              <article className="step-card">
                <span className="step-number">02</span>
                <Star size={24} strokeWidth={1.5} />
                <h3>找到喜歡的萌栗</h3>
                <p>遇見讓你心動的角色與配色。</p>
              </article>
              <article className="step-card">
                <span className="step-number">03</span>
                <ShoppingBag size={24} strokeWidth={1.5} />
                <h3>完成購買</h3>
                <p>按照貼文裡的方式，把它帶回家。</p>
              </article>
            </div>
            <div className="how-actions">
              <a className="button button-primary" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                前往 @chestnut_mora <ArrowUpRight size={17} strokeWidth={1.8} />
              </a>
              <a className="button button-outline" href={social.shopUrl} target="_blank" rel="noopener noreferrer">
                {social.shopLabel} <ArrowUpRight size={17} strokeWidth={1.8} />
              </a>
            </div>
          </div>
        </section>

        <section id="trust" className="trust-section" aria-label="栗子森林的品牌承諾">
          <div className="container trust-inner">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="trust-item" key={item.label}>
                  <Icon size={20} strokeWidth={1.55} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section id="faq" className="section faq-section">
          <div className="container faq-layout">
            <SectionHeading
              eyebrow="FAQ"
              title={
                <>
                  第一次來森林，
                  <br />
                  想知道的事。
                </>
              }
              description="還有想問的，來 Instagram 找我們聊聊。"
            />
            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div className={`faq-item ${isOpen ? 'is-open' : ''}`} key={item.question}>
                    <button
                      type="button"
                      className="faq-question"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown size={19} strokeWidth={1.7} />
                    </button>
                    <div className="faq-answer" id={`faq-answer-${index}`} hidden={!isOpen}>
                      {item.answer.map((paragraph, paragraphIndex) => (
                        <p key={`${item.question}-${paragraphIndex}`}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="instagram" className="section instagram-section">
          <div className="container instagram-layout">
            <div className="instagram-copy">
              <p className="eyebrow">FOLLOW THE FOREST</p>
              <h2>在 Instagram，<br />發現更多萌栗日常。</h2>
              <p>新品、最新萌栗、製作日常與更多可愛收藏，都會出現在 Instagram。</p>
              <a className="instagram-handle" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramMark size={19} />
                @chestnut_mora
              </a>
              <a className="button button-primary" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
                去逛逛 <ArrowUpRight size={17} strokeWidth={1.8} />
              </a>
            </div>
            <div className="ig-collage" aria-label="栗子森林生活情境圖片">
              <figure className="ig-photo ig-photo-one">
                <Image src="/assets/lifestyle/lifestyle-lavender.png" alt="紫色花朵旁的粉紫萌栗" width="1122" height="1402" loading="lazy" decoding="async" />
                <figcaption>little moments</figcaption>
              </figure>
              <figure className="ig-photo ig-photo-two">
                <Image src="/assets/products/product-color.png" alt="繽紛彩色珠珠萌栗" width="1080" height="1350" loading="lazy" decoding="async" />
                <figcaption>with you ♡</figcaption>
              </figure>
              <figure className="ig-photo ig-photo-three">
                <Image src="/assets/products/product-night.png" alt="夜空氛圍中的藍綠色萌栗" width="1080" height="1350" loading="lazy" decoding="async" />
                <figcaption>more good days</figcaption>
              </figure>
            </div>
          </div>
        </section>
      </main>

      <footer id="site-footer" className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Image src="/assets/brand/logo-white.png" alt="栗子森林 MORI Logo" width="1080" height="1080" loading="lazy" decoding="async" />
            <div>
              <p className="footer-name">栗子森林</p>
              <p className="footer-english">CHESTNUT MORA</p>
            </div>
          </div>
          <p className="footer-tagline">小小的萌栗，讓日常多一點喜歡。</p>
          <div className="footer-links">
            <a href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramMark size={18} tone="light" /> Instagram @chestnut_mora
            </a>
            <a href={social.shopUrl} target="_blank" rel="noopener noreferrer">
              <ShoppingBag size={18} strokeWidth={1.7} /> {social.shopLabel}
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {currentYear} Chestnut Mora</span>
          <span>Handmade in Taiwan</span>
        </div>
      </footer>

      <div className={`sticky-cta ${showStickyCta ? '' : 'is-hidden'}`}>
        <div className="container sticky-cta-inner">
          <span>今天的喜歡，先收藏起來。</span>
          <a className="button button-primary" href={social.instagramUrl} target="_blank" rel="noopener noreferrer">
            逛最新萌栗 <ArrowUpRight size={16} strokeWidth={1.8} />
          </a>
        </div>
      </div>
    </div>
  );
}
