import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/validators/index.js');

import { getPrismaRepository } from '../../lib/prisma.js';
import { hydrateOrderItems, hydrateCartItems } from '../../lib/validators/index.js';
import { validateOrder, validateCartSync, orderCreationSchema } from '../validation.js';
import { BadRequestError } from '../errorHandler.js';

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
    vi.mocked(getPrismaRepository).mockReturnValue({} as any);
  });

  it('should validate and set validatedItems on context', async () => {
    const hydratedItems = [
      { productId: 'prod-1', quantity: 2, currentPrice: 2999, frontendPrice: 2500, productName: 'Test Product', stockAvailable: 10 },
    ];
    vi.mocked(hydrateOrderItems).mockResolvedValue(hydratedItems as any);

    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 2, price: 2500 }],
      customerName: 'John Doe',
      customerPhone: '+919876543210',
    });

    await validateOrder(mockContext, nextFn);

    expect(hydrateOrderItems).toHaveBeenCalledWith({}, [
      { productId: 'prod-1', quantity: 2, price: 2500 },
    ]);
    expect(mockContext.set).toHaveBeenCalledWith('validatedItems', hydratedItems);
    expect(mockContext.set).toHaveBeenCalledWith('customerName', 'John Doe');
    expect(mockContext.set).toHaveBeenCalledWith('customerPhone', '+919876543210');
    expect(nextFn).toHaveBeenCalled();
  });

  it('should propagate errors from hydrateOrderItems', async () => {
    vi.mocked(hydrateOrderItems).mockRejectedValue(new BadRequestError('Product not found'));

    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'unknown', quantity: 1 }],
      customerName: 'John',
      customerPhone: '+919876543210',
    });

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });

  it('should handle Zod validation errors', async () => {
    mockContext.req.json.mockResolvedValue({
      items: [{ productId: '', quantity: 0 }],
      customerName: 'J',
      customerPhone: 'invalid',
    });

    await expect(validateOrder(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });

  it('should forward customer name and phone to context', async () => {
    vi.mocked(hydrateOrderItems).mockResolvedValue([] as any);

    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'p1', quantity: 1 }],
      customerName: 'Alice',
      customerPhone: '+94123456789',
    });

    await validateOrder(mockContext, nextFn);

    expect(mockContext.set).toHaveBeenCalledWith('customerName', 'Alice');
    expect(mockContext.set).toHaveBeenCalledWith('customerPhone', '+94123456789');
    expect(nextFn).toHaveBeenCalled();
  });
});

describe('validateCartSync middleware', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
    vi.mocked(getPrismaRepository).mockReturnValue({} as any);
  });

  it('should validate cart items', async () => {
    const hydratedItems = [
      { productId: 'prod-1', quantity: 2, currentPrice: 2999, inStock: true },
    ];
    vi.mocked(hydrateCartItems).mockResolvedValue(hydratedItems as any);

    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
    });

    await validateCartSync(mockContext, nextFn);

    expect(hydrateCartItems).toHaveBeenCalled();
    expect(mockContext.set).toHaveBeenCalledWith('validatedItems', hydratedItems);
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

  it('should propagate errors from hydrateCartItems', async () => {
    vi.mocked(hydrateCartItems).mockRejectedValue(new BadRequestError('DB error'));

    mockContext.req.json.mockResolvedValue({
      items: [{ productId: 'p1', quantity: 1 }],
    });

    await expect(validateCartSync(mockContext, nextFn)).rejects.toThrow(BadRequestError);
  });
});
