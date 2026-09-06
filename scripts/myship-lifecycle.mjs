export const REMOVAL_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

export const MYSHIP_LIFECYCLE_STATUSES = Object.freeze([
  'available',
  'soldout',
  'removed',
  'archived',
  'unknown',
]);

function identityKey(product) {
  const sourceKey = product.variantId || product.specId || product.skuId;
  if (sourceKey) return `source:${product.productId || ''}:${sourceKey}`;
  return `id:${product.id}`;
}

function hasElapsedSince(start, end) {
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime - startTime >= REMOVAL_GRACE_PERIOD_MS;
}

export function mergeProductLifecycle(previousProducts, incomingProducts, syncedAt) {
  const previousByIdentity = new Map(previousProducts.map((product) => [identityKey(product), product]));
  const incomingIdentities = new Set();

  const presentProducts = incomingProducts.map((incoming) => {
    const key = identityKey(incoming);
    incomingIdentities.add(key);
    const previous = previousByIdentity.get(key);

    if (previous?.status === 'archived') {
      return {
        ...incoming,
        id: previous.id,
        ...(previous.slug || incoming.slug ? { slug: previous.slug || incoming.slug } : {}),
        status: 'archived',
        missingSince: null,
        archivedAt: previous.archivedAt || syncedAt,
      };
    }

    return {
      ...incoming,
      id: previous?.id || incoming.id,
      ...(previous?.slug || incoming.slug ? { slug: previous?.slug || incoming.slug } : {}),
      missingSince: null,
    };
  });

  const retainedProducts = previousProducts
    .filter((previous) => !incomingIdentities.has(identityKey(previous)))
    .map((previous) => {
      if (previous.status === 'archived') return previous;

      const missingSince = previous.missingSince || syncedAt;
      const isRemoved = previous.status === 'removed' || hasElapsedSince(missingSince, syncedAt);
      const status = isRemoved ? 'removed' : previous.status;
      const retained = {
        ...previous,
        status,
        missingSince,
      };

      if (status === 'removed') {
        retained.removedAt = previous.removedAt || syncedAt;
      }

      return retained;
    });

  return [...presentProducts, ...retainedProducts];
}

export function buildMyShipStats(products) {
  return {
    totalVariants: products.length,
    available: products.filter((product) => product.status === 'available').length,
    soldout: products.filter((product) => product.status === 'soldout').length,
    removed: products.filter((product) => product.status === 'removed').length,
    archived: products.filter((product) => product.status === 'archived').length,
    unknown: products.filter((product) => product.status === 'unknown').length,
    excluded: products.filter((product) => product.excluded).length,
    withImage: products.filter((product) => Boolean(product.sourceImageUrl)).length,
    withoutImage: products.filter((product) => !product.sourceImageUrl).length,
  };
}
