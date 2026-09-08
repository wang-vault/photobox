import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWeights, weightedAverage } from '../lib/math';

test('empty analysis never becomes a set of weights', () => {
  assert.throws(() => normalizeWeights([]), /Lima rata-rata valid diperlukan/);
});
test('empty assessments never become a zero ranking score', () => {
  assert.throws(() => weightedAverage([], []), /Assessment atau bobot belum valid/);
});
test('non-finite mathematical inputs cannot produce research output', () => {
  assert.throws(() => normalizeWeights(Array(5).fill(Number.NaN)));
  assert.throws(() => normalizeWeights(Array(5).fill(Infinity)));
});
