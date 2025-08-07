
// Billing Configuration
// Change this value to adjust surcharge for batch label creation
// Default 5% surcharge (0.05)
export const BATCH_LABEL_SURCHARGE_PERCENT = parseFloat(
  process.env.VITE_BATCH_LABEL_SURCHARGE_PERCENT || '0.05'
);

/**
 * Apply configurable surcharge to batch label creation amounts
 * @param actualAmount - The actual amount before surcharge
 * @returns The final amount with surcharge applied, rounded to 2 decimals
 */
export const applyBatchSurcharge = (actualAmount: number): number => {
  const pct = Number(BATCH_LABEL_SURCHARGE_PERCENT) || 0;
  const total = Number(actualAmount) * (1 + pct);
  return Math.round(total * 100) / 100; // Round to 2 decimals
};

/**
 * Get the current surcharge percentage as a display string
 * @returns Percentage as string (e.g., "5%")
 */
export const getSurchargePercentageDisplay = (): string => {
  return `${(BATCH_LABEL_SURCHARGE_PERCENT * 100).toFixed(1)}%`;
};
