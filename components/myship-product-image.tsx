'use client';

/* oxlint-disable next/no-img-element */

import { useEffect, useRef, useState } from 'react';

const PRODUCT_PLACEHOLDER_IMAGE = '/assets/brand/logo-brown.png';

type ProductImageRecord = {
  slug?: string;
  image: string | null;
  sourceImageUrl: string | null;
};

type MyShipProductImageProps = {
  product: ProductImageRecord;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
};

function uniqueImageSources(product: ProductImageRecord) {
  const localImage = product.slug ? `/assets/products/${product.slug}.webp` : null;
  return Array.from(new Set([localImage, product.image, product.sourceImageUrl, PRODUCT_PLACEHOLDER_IMAGE].filter(Boolean))) as string[];
}

export function MyShipProductImage({ product, alt, className, loading = 'lazy' }: MyShipProductImageProps) {
  const sources = uniqueImageSources(product);
  const [sourceIndex, setSourceIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const currentSource = sources[Math.min(sourceIndex, sources.length - 1)] || PRODUCT_PLACEHOLDER_IMAGE;
  const isPlaceholder = currentSource === PRODUCT_PLACEHOLDER_IMAGE;

  useEffect(() => {
    if (isPlaceholder) return undefined;
    const image = imageRef.current;
    if (!image) return undefined;

    let handled = false;
    const advanceSource = () => {
      if (handled) return;
      handled = true;
      setSourceIndex((current) => Math.min(current + 1, sources.length - 1));
    };

    image.addEventListener('error', advanceSource);
    if (image.complete && image.naturalWidth === 0) advanceSource();
    return () => image.removeEventListener('error', advanceSource);
  }, [currentSource, isPlaceholder, sources.length]);

  return (
    <img
      ref={imageRef}
      className={`${className || ''}${isPlaceholder ? ' myship-product-image-placeholder' : ''}`.trim()}
      src={currentSource}
      alt={isPlaceholder ? '' : alt}
      aria-hidden={isPlaceholder ? true : undefined}
      loading={loading}
      decoding="async"
    />
  );
}
