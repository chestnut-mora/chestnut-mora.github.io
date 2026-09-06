'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import type { AvalStateId } from '@/data/aval';

type AvalMotionState = 'AVAL_IDLE' | 'AVAL_TOUCH_LEFT' | 'AVAL_TOUCH_RIGHT' | 'AVAL_TOUCH_CENTER' | 'AVAL_SETTLE';

const AVAL_PRELOAD_ASSETS = [
  '/assets/aval/peeled-box.webp',
  '/assets/aval/open-box-empty.webp',
  '/assets/aval/thank-you-card.webp',
  '/assets/aval/frosted-pouch-base.webp',
  '/assets/aval/frosted-pouch-empty.webp',
  '/assets/aval/bracelet.webp',
];

function AvalBraceletPresence({ active, onReady }: { active: boolean; onReady?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const lastPointerZoneRef = useRef('');
  const lastPointerMotionRef = useRef(0);
  const [avalReady, setAvalReady] = useState(false);
  const [avalFailed, setAvalFailed] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [motionState, setMotionState] = useState<AvalMotionState>('AVAL_IDLE');
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !inViewport) {
      animationRef.current?.cancel();
      animationRef.current = null;
    }
  }, [active, inViewport]);

  const runSway = useCallback((direction: 'left' | 'right' | 'center', amplitude = 1) => {
    const target = motionRef.current;
    if (!target || !active || !inViewport || avalFailed) return;

    const sign = direction === 'left' ? -1 : 1;
    const peak = direction === 'center' ? 2.2 : 3 * sign;
    setShowHint(false);
    setMotionState(direction === 'left' ? 'AVAL_TOUCH_LEFT' : direction === 'right' ? 'AVAL_TOUCH_RIGHT' : 'AVAL_TOUCH_CENTER');
    animationRef.current?.cancel();
    animationRef.current = target.animate(
      [
        { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
        { transform: `translate3d(${peak * 0.65 * amplitude}px, 1px, 0) rotate(${peak * amplitude}deg)`, offset: 0.22 },
        { transform: `translate3d(${-peak * 0.3 * amplitude}px, 0, 0) rotate(${-peak * 0.46 * amplitude}deg)`, offset: 0.5 },
        { transform: `translate3d(${peak * 0.12 * amplitude}px, 0, 0) rotate(${peak * 0.2 * amplitude}deg)`, offset: 0.72 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
      ],
      { duration: 1500, easing: 'cubic-bezier(0.22, 0.72, 0.24, 1)', fill: 'both' },
    );
    animationRef.current.onfinish = () => {
      setMotionState('AVAL_SETTLE');
      window.setTimeout(() => setMotionState('AVAL_IDLE'), 160);
    };
  }, [active, avalFailed, inViewport]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const now = performance.now();
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const zone = ratio < 0.42 ? 'left' : ratio > 0.58 ? 'right' : 'center';
    if (zone === lastPointerZoneRef.current || now - lastPointerMotionRef.current < 850) return;
    lastPointerZoneRef.current = zone;
    lastPointerMotionRef.current = now;
    runSway(zone, 0.48);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    runSway(ratio < 0.38 ? 'left' : ratio > 0.62 ? 'right' : 'center');
  };

  return (
    <div
      ref={rootRef}
      className={`aval-presence ${active ? 'is-active' : ''} ${avalReady && !avalFailed ? 'is-ready' : ''}`}
      data-aval-state={motionState}
      onPointerEnter={(event) => event.pointerType === 'mouse' && runSway('center', 0.32)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        lastPointerZoneRef.current = '';
        if (motionState !== 'AVAL_IDLE') runSway('center', 0.24);
      }}
      onPointerDown={handlePointerDown}
      aria-label={active ? '輕碰萌栗，讓手鍊自然晃動' : undefined}
    >
      <div ref={motionRef} className="aval-presence-motion">
        <Image
          className="aval-live-bracelet"
          src="/assets/aval/bracelet.webp"
          alt=""
          width={702}
          height={1200}
          loading="lazy"
          onLoad={() => {
            setAvalReady(true);
            onReady?.();
          }}
          onError={() => setAvalFailed(true)}
        />
      </div>
      {active && avalReady && !avalFailed && showHint ? <span className="aval-touch-hint">輕碰看看 ♡</span> : null}
    </div>
  );
}

export function AvalUnboxingHero() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const sealedRef = useRef<HTMLImageElement>(null);
  const peeledRef = useRef<HTMLImageElement>(null);
  const openRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLImageElement>(null);
  const pouchBaseRef = useRef<HTMLImageElement>(null);
  const pouchRef = useRef<HTMLImageElement>(null);
  const braceletRef = useRef<HTMLImageElement>(null);
  const pouchBraceletRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<AvalStateId>('sealed');
  const [isRunning, setIsRunning] = useState(false);
  const [avalActive, setAvalActive] = useState(false);
  const [avalLiveReady, setAvalLiveReady] = useState(false);
  const [assetError, setAssetError] = useState(false);

  const markAvalReady = useCallback(() => setAvalLiveReady(true), []);

  useEffect(() => {
    const preload = () => {
      AVAL_PRELOAD_ASSETS.forEach((src) => {
        const image = new window.Image();
        image.decoding = 'async';
        image.src = src;
      });
    };

    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const requestIdle = (window as Window & { requestIdleCallback?: typeof window.requestIdleCallback }).requestIdleCallback;
    if (typeof requestIdle === 'function') {
      idleId = requestIdle.call(window, preload, { timeout: 1200 });
    } else {
      timeoutId = Number(globalThis.setTimeout(preload, 250));
    }

    return () => {
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) globalThis.clearTimeout(timeoutId);
    };
  }, []);

  useLayoutEffect(() => {
    const elements = [sealedRef.current, peeledRef.current, openRef.current, cardRef.current, pouchBaseRef.current, pouchRef.current, braceletRef.current, pouchBraceletRef.current];
    if (elements.some((element) => !element)) return;

    const context = gsap.context(() => {
      gsap.set(sealedRef.current, { autoAlpha: 1, x: 0, y: 0, scale: 0.92, xPercent: -50, yPercent: -47 });
      gsap.set([peeledRef.current, openRef.current, cardRef.current, pouchBaseRef.current, pouchRef.current, pouchBraceletRef.current], { autoAlpha: 0 });
      gsap.set(peeledRef.current, { x: 0, y: 0, scale: 0.92, xPercent: -50, yPercent: -47 });
      gsap.set(openRef.current, { x: 0, y: 0, scale: 0.9, xPercent: -50, yPercent: -48, filter: 'blur(10px) drop-shadow(0 18px 18px rgba(74, 49, 33, 0.15))' });
      // Position the contents against the open-box interior. Card sits lower
      // and above the pouch; all three pouch layers share one transform so the
      // bracelet remains physically attached until the extraction beat.
      gsap.set(cardRef.current, { x: 0, y: 0, scale: 0.52, xPercent: -76, yPercent: -12, rotation: -6 });
      gsap.set([pouchBaseRef.current, pouchRef.current, pouchBraceletRef.current], { x: 0, y: 0, scale: 0.42, xPercent: -28, yPercent: -32, rotation: -8 });
      gsap.set(braceletRef.current, { autoAlpha: 1, x: 0, y: 0, scale: 0.8, xPercent: 0, yPercent: 18, rotation: 0 });

      timelineRef.current = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
        .addLabel('SEALED').set(pouchBraceletRef.current, { transformOrigin: '50% 50%' }).call(() => setPhase('sealed'))
        .addLabel('PEEL').call(() => setPhase('peel')).to(sealedRef.current, { autoAlpha: 0, duration: 0.68, ease: 'none' }).to(peeledRef.current, { autoAlpha: 1, duration: 0.68, ease: 'none' }, '<')
        .addLabel('PEEL_BLUR').to(peeledRef.current, { scale: 0.98, filter: 'blur(10px) drop-shadow(0 18px 18px rgba(74, 49, 33, 0.15))', duration: 0.36, ease: 'power1.in' })
        .addLabel('OPEN').call(() => setPhase('open')).to(peeledRef.current, { autoAlpha: 0, scale: 1.02, filter: 'blur(14px) drop-shadow(0 18px 18px rgba(74, 49, 33, 0.12))', duration: 1.26, ease: 'none' }).to(openRef.current, { autoAlpha: 1, scale: 0.84, filter: 'blur(0px) drop-shadow(0 18px 18px rgba(74, 49, 33, 0.15))', duration: 1.44, ease: 'power2.out' }, '<').to(cardRef.current, { autoAlpha: 1, duration: 1.44 }, '<').to(pouchBaseRef.current, { autoAlpha: 1, duration: 1.44 }, '<').to(pouchBraceletRef.current, { autoAlpha: 1, duration: 1.44 }, '<').to(pouchRef.current, { autoAlpha: 0.7, duration: 1.44 }, '<')
        .addLabel('CARD_REVEAL').call(() => setPhase('card-reveal')).to(cardRef.current, { scale: 1.24, xPercent: -72, yPercent: -44, rotation: -5, duration: 0.86, ease: 'power2.out' }).to({}, { duration: 0.3 }).to(cardRef.current, { scale: 0.38, xPercent: -148, yPercent: -76, rotation: -7, duration: 0.68 })
        .addLabel('POUCH_REVEAL').call(() => setPhase('pouch-reveal')).to(openRef.current, { autoAlpha: 0.28, scale: 0.73, xPercent: -67, yPercent: -37, duration: 0.7 }).to(cardRef.current, { autoAlpha: 0.86, scale: 0.38, xPercent: -148, yPercent: -76, rotation: -7, duration: 0.7 }, '<').to([pouchBaseRef.current, pouchRef.current, pouchBraceletRef.current], { x: 0, y: 0, scale: 0.72, xPercent: -46, yPercent: -44, rotation: -1, duration: 0.84 }, '<0.08')
        .addLabel('BRACELET_REVEAL').call(() => setPhase('bracelet-reveal')).to([pouchBaseRef.current, pouchRef.current, pouchBraceletRef.current], { scale: 0.48, xPercent: -42, yPercent: -8, rotation: -2, duration: 0.95 }).to(braceletRef.current, { autoAlpha: 1, scale: 1.54, xPercent: 0, yPercent: -102, rotation: 1, duration: 0.95 }, '<0.04')
        .addLabel('FINAL_HERO').call(() => setPhase('final')).to([sealedRef.current, peeledRef.current, openRef.current, cardRef.current, pouchBaseRef.current, pouchRef.current], { autoAlpha: 0, duration: 0.55 }).to(pouchBraceletRef.current, { autoAlpha: 1, x: 0, y: 0, scale: 0.88, xPercent: -50, yPercent: -50, rotation: 0, duration: 0.82 }, '<0.08').to(braceletRef.current, { autoAlpha: 1, x: 0, y: 0, scale: 1, xPercent: 0, yPercent: 0, rotation: 0, duration: 0.82 }, '<').call(() => {
          const presence = scopeRef.current?.querySelector<HTMLElement>('.aval-presence');
          if (presence) gsap.set(presence, { clearProps: 'opacity,visibility' });
          setAvalActive(true);
        }).call(() => setIsRunning(false)).timeScale(0.66);
    }, scopeRef);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      context.revert();
    };
  }, []);

  useLayoutEffect(() => {
    if (!avalActive) {
      gsap.set(pouchBraceletRef.current, { autoAlpha: 0 });
      return;
    }
    if (!avalLiveReady || !pouchBraceletRef.current) return;

    // Both layers share identical geometry and shadow. Swap them before paint
    // so their alpha shadows never stack during the GSAP-to-AVAL handoff.
    gsap.set(pouchBraceletRef.current, { autoAlpha: 0 });
  }, [avalActive, avalLiveReady]);

  const playTimeline = () => {
    if (assetError) {
      setPhase('final');
      return;
    }
    const presence = scopeRef.current?.querySelector<HTMLElement>('.aval-presence');
    if (presence) gsap.set(presence, { autoAlpha: 0 });
    setAvalActive(false);
    setIsRunning(true);
    timelineRef.current?.restart();
  };

  return (
    <section className="aval-hero" aria-label="栗子森林開箱互動展示">
      <div ref={scopeRef} className="container aval-layout">
        <div className="aval-copy">
          <p className="aval-eyebrow">CHESTNUT MORA · UNBOXING</p>
          <div className="aval-heading"><span>把可愛和好心情，</span><span>一起送到你身邊。</span></div>
          <p className="aval-lede">從一個小小包裹開始，<br />打開屬於你的萌栗日常。</p>
          <button className="button button-primary aval-primary-action" type="button" onClick={playTimeline} disabled={isRunning}>
            {isRunning ? '萌栗正在來的路上…' : phase === 'final' ? '再打開一次' : '打開看看'} <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="aval-player" data-state={phase}>
          <div className="aval-stage">
            {assetError ? <span className="aval-static-fallback"><span>栗子森林</span><strong>你的萌栗已送達 ♡</strong></span> : <>
              <Image ref={sealedRef} className="aval-object aval-gsap-object gsap-sealed" src="/assets/aval/sealed-box.png" alt="封好的栗子森林萌粒手機鍊開箱盒" width={1536} height={1024} priority onError={() => setAssetError(true)} />
              <Image ref={peeledRef} className="aval-object aval-gsap-object gsap-peeled" src="/assets/aval/peeled-box.webp" alt="HELLO 封口貼半撕開的栗子森林萌粒手機鍊包裝盒" width={1536} height={1024} loading="lazy" onError={() => setAssetError(true)} />
              <Image ref={openRef} className="aval-object aval-gsap-object gsap-open" src="/assets/aval/open-box-empty.webp" alt="完整打開的栗子森林萌粒手機鍊開箱盒" width={906} height={1199} loading="lazy" onError={() => setAssetError(true)} />
              <Image ref={cardRef} className="aval-object aval-gsap-object gsap-card" src="/assets/aval/thank-you-card.webp" alt="栗子森林萌粒手機鍊包裝內的原創手繪 Thank You 感謝小卡" width={800} height={999} loading="lazy" onError={() => setAssetError(true)} />
              <Image ref={pouchBaseRef} className="aval-object aval-gsap-object gsap-pouch-base" src="/assets/aval/frosted-pouch-base.webp" alt="" aria-hidden="true" width={679} height={1200} loading="lazy" onError={() => setAssetError(true)} />
              <Image ref={pouchRef} className="aval-object aval-gsap-object gsap-pouch" src="/assets/aval/frosted-pouch-empty.webp" alt="保留淡粉棕色軟木塞圖樣的萌粒手機鍊霧面包裝袋" width={679} height={1200} loading="lazy" onError={() => setAssetError(true)} />
              <div ref={pouchBraceletRef} className="aval-object aval-gsap-object gsap-pouch-bracelet-layer">
                <Image ref={braceletRef} className="gsap-bracelet-static" src="/assets/aval/bracelet.webp" alt="栗子森林萌粒手機鍊與角色吊飾完整展示" width={702} height={1200} loading="lazy" onError={() => setAssetError(true)} />
              </div>
              <AvalBraceletPresence active={avalActive && phase === 'final'} onReady={markAvalReady} />
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
