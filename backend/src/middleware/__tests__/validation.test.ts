import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('../../lib/prisma.js');

import { getPrisma } from '../../lib/prisma.js';
import { validateOrder, validateCartSync, orderCreationSchema } from '../validation.js';
import { BadRequestError, StockUnavailableError } from '../errorHandler.js';

function createMockContext(overrides: any = {}): any {
  return {
    req: {
      json: vi.fn(),
    },
    env: { DB: {} as any },
    set: vi.fn(),
    ...overrides,
  };
}

describe('orderCreationSchema', () => {
  it('should validate valid order input', () => {
    const validInput = {
      items: [{ productId: 'prod-1', quantity: 2 }],
      customerName: 'John Doe',
      customerPhone: '+919876543210',
    };

    const result = orderCreationSchema.parse(validInput);
    expect(result.items).toHaveLength(1);
  });

  it('should reject empty cart', () => {
    expect(() => orderCreationSchema.parse({
      items: [],
      customerName: 'John',
      customerPhone: '+919876543210',
    })).toThrow();
  });

  it('should reject short customer name', () => {
    expect(() => orderCreationSchema.parse({
      items: [{ productId: 'p1', quantity: 1 }],
      customerName: 'J',
      customerPhone: '+919876543210',
    })).toThrow();
  });

  it('should reject invalid phone', () => {
    expect(() => orderCreationSchema.parse({
      items: [{ productId: 'p1', quantity: 1 }],
      customerName: 'John',
      customerPhone: 'not-a-phone',
    })).toThrow();
  });

  it('should reject zero quantity', () => {
    expect(() => orderCreationSchema.parse({
      items: [{ productId: 'p1', quantity: 0 }],
      customerName: 'John',
      customerPhone: '+919876543210',
    })).toThrow();
  });

  it('should reject negative quantity', () => {
    expect(() => orderCreationSchema.parse({
      items: [{ productId: 'p1', quantity: -1 }],
      customerName: 'John',
      customerPhone: '+919876543210',
    })).toThrow();
  });
});

describe('validateOrder middleware', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it('should validate and set validatedItems on context', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 2 }],
      customerName: 'John Doe',
      customerPhone: '+919876543210',
    });

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Test Product', price: 2999, stock: 10 },
        ]),
      },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await validateOrder(mockContext, nextFn);

    expect(mockContext.set).toHaveBeenCalledWith('validatedItems', expect.arrayContaining([
      expect.objectContaining({
        productId: 'prod-1',
        currentPrice: 2999,
        quantity: 2,
      }),
    ]));
    expect(mockContext.set).toHaveBeenCalledWith('customerName', 'John Doe');
    expect(mockContext.set).toHaveBeenCalledWith('customerPhone', '+919876543210');
    expect(nextFn).toHaveBeenCalled();
  });

  it('should throw if product not found', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'unknown', quantity: 1 }],
      customerName: 'John',
      customerPhone: '+919876543210',
    });

    const mockPrisma = { product: { findMany: vi.fn().mockResolvedValue([]) } };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });

  it('should throw StockUnavailableError if stock insufficient', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 100 }],
      customerName: 'John',
      customerPhone: '+919876543210',
    });

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Test Product', price: 2999, stock: 5 },
        ]),
      },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow(StockUnavailableError);
  });

  it('should collect multiple out-of-stock errors', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [
        { productId: 'prod-1', quantity: 100 },
        { productId: 'prod-2', quantity: 50 },
      ],
      customerName: 'John',
      customerPhone: '+919876543210',
    });

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Product 1', price: 100, stock: 5 },
          { id: 'prod-2', name: 'Product 2', price: 200, stock: 10 },
        ]),
      },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow('Only 5 available');
  });

  it('should handle Zod validation errors', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: '', quantity: 0 }],
      customerName: 'J',
      customerPhone: 'invalid',
    });

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });
});

describe('validateCartSync middleware', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it('should validate cart items', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
    });

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', price: 2999, stock: 10 },
        ]),
      },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await validateCartSync(mockContext, nextFn);

    expect(mockContext.set).toHaveBeenCalledWith('validatedItems', expect.any(Array));
    expect(nextFn).toHaveBeenCalled();
  });

  it('should throw for empty cart', async () => {
    mockContext.req.json.mockResolvedValue({ items: [] });

    await expect(validateCartSync(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });

  it('should handle Zod validation errors', async () => {
    mockContext.req.json.mockResolvedValue({ items: [{ productId: '', quantity: 0 }] });

    await expect(validateCartSync(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });

  it('should mark inStock as false when stock insufficient', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 100 }],
    });

    const mockPrisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'prod-1', price: 2999, stock: 5 },
        ]),
      },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    await validateCartSync(mockContext, nextFn);

    const validatedItems = vi.mocked(mockContext.set).mock.calls.find(
      (call: any) => call[0] === 'validatedItems'
    )?.[1];
    expect(validatedItems[0].inStock).toBe(false);
  });
});
