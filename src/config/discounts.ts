// Centralized discount display configuration for rate UI
// Adjust here to tweak the visible savings range across the app
export const DISCOUNT_CONFIG = {
  MIN_PERCENT: 50, // Minimum shown savings percentage
  MAX_PERCENT: 95, // Maximum shown savings percentage
};

export function clampDiscount(p: number): number {
  const { MIN_PERCENT, MAX_PERCENT } = DISCOUNT_CONFIG;
  if (Number.isNaN(p) || !Number.isFinite(p)) return MIN_PERCENT;
  return Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, Math.round(p)));
}

// Given current and original prices, compute clamped percent
export function computeDiscountPercent(current: number, original?: number | null): number {
  if (!original || original <= current) return DISCOUNT_CONFIG.MIN_PERCENT;
  const raw = ((original - current) / original) * 100;
  return clampDiscount(raw);
}

// When original price is missing, synthesize an original from current and desired percent
export function synthesizeOriginalFromPercent(current: number, percent: number): number {
  const fraction = 1 - percent / 100;
  if (fraction <= 0) return current; // safety
  return current / fraction;
}
