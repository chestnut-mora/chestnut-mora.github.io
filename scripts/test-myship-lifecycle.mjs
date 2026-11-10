import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildMyShipStats, mergeProductLifecycle, REMOVAL_GRACE_PERIOD_MS, stableProductId } from './myship-lifecycle.mjs';

const baseProduct = {
  id: 'myship-example',
  name: '測試萌栗',
  price: 580,
  image: 'https://example.com/image.jpg',
  sourceImageUrl: 'https://example.com/image.jpg',
  sourceVariantName: '測試萌栗',
  sourceUrl: 'https://example.com/listing',
  deepLink: null,
  status: 'available',
  syncedAt: '2026-09-06T00:00:00.000Z',
  productId: 'listing-1',
  variantId: 'variant-1',
  specId: 'variant-1',
  skuId: null,
  excluded: false,
};

const firstSyncAt = '2026-09-06T00:00:00.000Z';
const firstSync = mergeProductLifecycle([], [baseProduct], firstSyncAt);
assert.equal(firstSync[0].status, 'available');
assert.equal(firstSync[0].missingSince, null);

const sharedName = '同名規格';
const legacyNameId = `myship-${createHash('sha256').update(`store-1:${sharedName}`).digest('hex').slice(0, 16)}`;
const newSourceId = stableProductId('store-1', 'listing-new', 'variant-new');
assert.notEqual(legacyNameId, newSourceId);
const mergedSameNameProducts = mergeProductLifecycle(
  [{ ...baseProduct, id: legacyNameId, name: sharedName, sourceVariantName: sharedName, productId: 'listing-old', variantId: 'variant-old', specId: 'variant-old' }],
  [{ ...baseProduct, id: newSourceId, name: sharedName, sourceVariantName: sharedName, productId: 'listing-new', variantId: 'variant-new', specId: 'variant-new' }],
  '2026-09-06T01:00:00.000Z',
);
assert.equal(mergedSameNameProducts.length, 2);
assert.equal(new Set(mergedSameNameProducts.map((product) => product.id)).size, 2);

const missingBeforeGrace = mergeProductLifecycle(firstSync, [], '2026-09-06T23:59:59.000Z');
assert.equal(missingBeforeGrace[0].status, 'available');
assert.equal(missingBeforeGrace[0].missingSince, '2026-09-06T23:59:59.000Z');

const missingAfterGraceAt = new Date(Date.parse(missingBeforeGrace[0].missingSince) + REMOVAL_GRACE_PERIOD_MS + 1).toISOString();
const missingAfterGrace = mergeProductLifecycle(missingBeforeGrace, [], missingAfterGraceAt);
assert.equal(missingAfterGrace[0].status, 'removed');
assert.equal(missingAfterGrace[0].removedAt, missingAfterGraceAt);

const restored = mergeProductLifecycle(
  missingAfterGrace,
  [{ ...baseProduct, name: '測試萌栗改名', sourceVariantName: '測試萌栗改名', status: 'available' }],
  '2026-09-07T01:00:00.000Z',
);
assert.equal(restored[0].id, baseProduct.id);
assert.equal(restored[0].status, 'available');
assert.equal(restored[0].missingSince, null);

const archived = mergeProductLifecycle(
  [{ ...baseProduct, status: 'archived', archivedAt: '2026-09-07T02:00:00.000Z' }],
  [baseProduct],
  '2026-09-07T03:00:00.000Z',
);
assert.equal(archived[0].status, 'archived');

const stats = buildMyShipStats([
  { ...baseProduct, status: 'available' },
  { ...baseProduct, id: 'soldout', status: 'soldout' },
  { ...baseProduct, id: 'removed', status: 'removed' },
  { ...baseProduct, id: 'archived', status: 'archived' },
]);
assert.deepEqual(
  {
    available: stats.available,
    soldout: stats.soldout,
    removed: stats.removed,
    archived: stats.archived,
  },
  { available: 1, soldout: 1, removed: 1, archived: 1 },
);

console.log('MyShip lifecycle tests passed.');
