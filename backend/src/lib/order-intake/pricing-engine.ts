import type { PricingResult } from './types.js';

export function computePricing(
  items: Array<{ currentPrice: number; quantity: number }>,
  taxRate: number
): PricingResult {
  const subtotal = items.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  return { subtotal, taxRate, tax, total: subtotal + tax };
}
