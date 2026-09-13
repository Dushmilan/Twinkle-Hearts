import { describe, it, expect, vi } from 'vitest';
import { hydrateOrderItems, hydrateCartItems } from '../order-validators.js';
import { BadRequestError } from '../../../middleware/errorHandler.js';

describe('hydrateOrderItems', () => {
  it('should return hydrated items for valid products', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Test Product', price: 2999 },
        ]),
      },
    };

    const result = await hydrateOrderItems(prisma as any, [
      { productId: 'prod-1', quantity: 2, price: 2500 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      productId: 'prod-1',
      quantity: 2,
      currentPrice: 2999,
      frontendPrice: 2500,
      productName: 'Test Product',
    });
  });

  it('should use DB price over frontend price', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'P1', price: 5000 },
        ]),
      },
    };

    const result = await hydrateOrderItems(prisma as any, [
      { productId: 'prod-1', quantity: 1, price: 1000 },
    ]);

    expect(result[0].currentPrice).toBe(5000);
    expect(result[0].frontendPrice).toBe(1000);
  });

  it('should throw BadRequestError for non-existent product', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'unknown', quantity: 1 },
    ])).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError for inactive product', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'inactive-prod', quantity: 1 },
    ])).rejects.toThrow(BadRequestError);
  });

  it('should handle multiple valid items', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'One', price: 100 },
          { id: 'p2', name: 'Two', price: 200 },
        ]),
      },
    };

    const result = await hydrateOrderItems(prisma as any, [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 3 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].currentPrice).toBe(100);
    expect(result[1].currentPrice).toBe(200);
  });

  it('should query products with isActive filter', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { product: { findMany } };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'p1', quantity: 1 },
    ])).rejects.toThrow(BadRequestError);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['p1'] },
        isActive: true,
      },
      select: { id: true, name: true, price: true },
    });
  });
});

describe('hydrateCartItems', () => {
  it('should hydrate items with DB price', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', price: 2999 },
        ]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'prod-1', quantity: 2 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      productId: 'prod-1',
      quantity: 2,
      currentPrice: 2999,
    });
  });

  it('should handle non-existent product with zero price', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'unknown', quantity: 1 },
    ]);

    expect(result[0].currentPrice).toBe(0);
  });

  it('should handle multiple items', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', price: 100 },
          { id: 'p2', price: 200 },
        ]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);

    expect(result[0].currentPrice).toBe(100);
    expect(result[1].currentPrice).toBe(200);
  });
});
