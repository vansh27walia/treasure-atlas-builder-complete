// Utility to compute discount percent consistently across normal and batch UIs
// Ensures a clamped range when desired (e.g., 50% to 95%)
export const computeDiscountPercent = (
  original: number | string | undefined | null,
  current: number | string | undefined | null,
  options?: { clampMin?: number; clampMax?: number }
): number => {
  const orig = typeof original === 'string' ? parseFloat(original) : Number(original);
  const curr = typeof current === 'string' ? parseFloat(current) : Number(current);
  if (!isFinite(orig) || !isFinite(curr) || orig <= 0 || curr <= 0 || curr >= orig) return 0;
  let pct = Math.round((1 - curr / orig) * 100);
  const min = options?.clampMin;
  const max = options?.clampMax;
  if (typeof min === 'number') pct = Math.max(min, pct);
  if (typeof max === 'number') pct = Math.min(max, pct);
  return pct;
};
