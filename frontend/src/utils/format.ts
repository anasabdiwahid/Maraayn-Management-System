/**
 * Utility functions for currency and number formatting
 */

/**
 * Formats a number or string into a clean currency representation.
 * Rounds to 2 decimal places to eliminate floating point issues (e.g. 3.7300000000000002 -> 3.73).
 * If the number is whole (e.g. 0, 50), it doesn't add trailing zeroes unless required.
 */
export const formatMoney = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0';

  // Fix floating point precision
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;

  if (rounded === 0) return '0';

  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats a number with currency symbol (e.g. $3.73 or $53.15)
 */
export const formatCurrency = (
  amount: number | string | undefined | null,
  symbol = '$'
): string => {
  return `${symbol}${formatMoney(amount)}`;
};
