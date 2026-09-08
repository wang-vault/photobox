/** No rounding until presentation. Reject missing/out-of-range input. */
export function normalizeWeights(means: number[]) {
  if (means.length !== 5 || means.some((x) => !Number.isFinite(x) || x < 1 || x > 5))
    throw new Error('Lima rata-rata valid diperlukan.');
  const total = means.reduce((a, b) => a + b, 0);
  const first = means.slice(0, 4).map((x) => x / total);
  return [...first, 1 - first.reduce((a, b) => a + b, 0)];
}
export function weightedAverage(scores: number[], weights: number[]) {
  if (
    scores.length !== 5 ||
    weights.length !== 5 ||
    scores.some((x) => !Number.isInteger(x) || x < 1 || x > 5) ||
    weights.some((x) => !Number.isFinite(x) || x <= 0) ||
    Math.abs(weights.reduce((a, b) => a + b, 0) - 1) > 1e-12
  )
    throw new Error('Assessment atau bobot belum valid.');
  return scores.reduce((sum, value, i) => sum + value * weights[i], 0);
}
export const number = (value: number, digits = 2) =>
  new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
export const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
