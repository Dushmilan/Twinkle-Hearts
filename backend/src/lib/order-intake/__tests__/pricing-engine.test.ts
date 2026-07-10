import { describe, it, expect } from 'vitest';
import { computePricing } from '../pricing-engine.js';

describe('computePricing', () => {
  it('should compute pricing for single item', () => {
    const result = computePricing(
      [{ currentPrice: 2999, quantity: 2 }],
      0.18
    );

    expect(result.subtotal).toBe(5998);
    expect(result.taxRate).toBe(0.18);
    expect(result.tax).toBe(1079.64);
    expect(result.total).toBe(7077.64);
  });

  it('should handle multiple items', () => {
    const result = computePricing(
      [
        { currentPrice: 4999, quantity: 1 },
        { currentPrice: 1999, quantity: 3 },
      ],
      0.18
    );

    expect(result.subtotal).toBe(10996);
    expect(result.tax).toBe(1979.28);
    expect(result.total).toBe(12975.28);
  });

  it('should use provided tax rate', () => {
    const result = computePricing(
      [{ currentPrice: 1000, quantity: 1 }],
      0.05
    );

    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(50);
    expect(result.total).toBe(1050);
  });

  it('should return zero for empty items', () => {
    const result = computePricing([], 0.18);

    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should round tax to two decimal places', () => {
    const result = computePricing(
      [{ currentPrice: 333, quantity: 1 }],
      0.18
    );

    expect(result.tax).toBe(59.94);
    expect(result.total).toBe(392.94);
  });
});
