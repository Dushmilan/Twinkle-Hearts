import { describe, it, expect, vi } from 'vitest';
import { hydrateOrderItems, hydrateCartItems } from '../order-validators.js';
import { BadRequestError, StockUnavailableError } from '../../../middleware/errorHandler.js';

describe('hydrateOrderItems', () => {
  it('should return hydrated items for valid products', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Test Product', price: 2999, stock: 10 },
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
      stockAvailable: 10,
    });
  });

  it('should use DB price over frontend price', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'P1', price: 5000, stock: 5 },
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

  it('should throw StockUnavailableError when stock insufficient', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Low Stock', price: 100, stock: 3 },
        ]),
      },
    };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'prod-1', quantity: 10 },
    ])).rejects.toThrow(StockUnavailableError);
  });

  it('should report product name in out-of-stock error', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'Blue Card', price: 100, stock: 1 },
        ]),
      },
    };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'p1', quantity: 5 },
    ])).rejects.toThrow('Blue Card');
  });

  it('should collect multiple out-of-stock errors', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'A', price: 100, stock: 1 },
          { id: 'p2', name: 'B', price: 200, stock: 2 },
        ]),
      },
    };

    await expect(hydrateOrderItems(prisma as any, [
      { productId: 'p1', quantity: 10 },
      { productId: 'p2', quantity: 20 },
    ])).rejects.toThrow('Only 1 available');
  });

  it('should handle multiple valid items', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', name: 'One', price: 100, stock: 5 },
          { id: 'p2', name: 'Two', price: 200, stock: 10 },
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
      select: { id: true, name: true, price: true, stock: true },
    });
  });
});

describe('hydrateCartItems', () => {
  it('should hydrate items with DB price and stock', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', price: 2999, stock: 10 },
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
      inStock: true,
    });
  });

  it('should mark inStock false when quantity exceeds stock', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', price: 100, stock: 3 },
        ]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'prod-1', quantity: 10 },
    ]);

    expect(result[0].inStock).toBe(false);
    expect(result[0].currentPrice).toBe(100);
  });

  it('should handle non-existent product with zero price and inStock false', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'unknown', quantity: 1 },
    ]);

    expect(result[0].currentPrice).toBe(0);
    expect(result[0].inStock).toBe(false);
  });

  it('should handle multiple items', async () => {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', price: 100, stock: 5 },
          { id: 'p2', price: 200, stock: 0 },
        ]),
      },
    };

    const result = await hydrateCartItems(prisma as any, [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);

    expect(result[0].inStock).toBe(true);
    expect(result[1].inStock).toBe(false);
  });
});
