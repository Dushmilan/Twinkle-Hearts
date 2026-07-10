import { describe, it, expect, vi } from 'vitest';
import { processOrder } from '../order-intake.js';
import { StockUnavailableError } from '../../../middleware/errorHandler.js';

describe('processOrder', () => {
  const mockInput = {
    userId: 'user-1',
    customerName: 'John Doe',
    customerPhone: '+919876543210',
    items: [
      { productId: 'prod-1', quantity: 2, currentPrice: 2999, productName: 'Test Product' },
    ],
  };

  const mockEnv = {
    TAX_RATE: '0.18',
    WHATSAPP_BUSINESS_NUMBER: '+94771234567',
  };

  function createMockPrisma(txResult?: any) {
    const mockTx = {
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      order: {
        create: vi.fn().mockResolvedValue(txResult || {
          id: 'order-1',
          userId: 'user-1',
          customerName: 'John Doe',
          customerPhone: '+919876543210',
          subtotal: 5998,
          tax: 1079.64,
          total: 7077.64,
          status: 'PENDING_WHATSAPP_CONFIRMATION',
          items: [{ productId: 'prod-1', productName: 'Test Product', quantity: 2, price: 2999 }],
          priceSnapshot: JSON.stringify([{ productId: 'prod-1', priceAtOrder: 2999 }]),
          createdAt: new Date(),
        }),
      },
    };

    return {
      $transaction: vi.fn(async (callback: any) => callback(mockTx)),
      product: mockTx.product,
      order: mockTx.order,
    };
  }

  it('should process an order successfully', async () => {
    const prisma = createMockPrisma();
    const result = await processOrder(prisma as any, mockEnv, mockInput);

    expect(result.order.id).toBe('order-1');
    expect(result.order.subtotal).toBe(5998);
    expect(result.order.total).toBe(7077.64);
    expect(result.order.status).toBe('PENDING_WHATSAPP_CONFIRMATION');
    expect(result.whatsappDeepLink).toContain('wa.me/+94771234567');
  });

  it('should include item details in order', async () => {
    const prisma = createMockPrisma();
    const result = await processOrder(prisma as any, mockEnv, mockInput);

    expect(result.order.items).toHaveLength(1);
    expect(result.order.items[0].productName).toBe('Test Product');
    expect(result.order.items[0].quantity).toBe(2);
    expect(result.order.items[0].price).toBe(2999);
  });

  it('should throw StockUnavailableError when stock insufficient', async () => {
    const mockTx = {
      product: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      order: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: any) => callback(mockTx)),
    };

    await expect(processOrder(prisma as any, mockEnv, mockInput)).rejects.toThrow(StockUnavailableError);
  });

  it('should use TAX_RATE from env', async () => {
    const prisma = createMockPrisma({
      id: 'order-2', subtotal: 1000, tax: 50, total: 1050,
      status: 'PENDING_WHATSAPP_CONFIRMATION', items: [],
      priceSnapshot: '[]', createdAt: new Date(),
      userId: 'user-1', customerName: 'Test', customerPhone: '+919876543210',
    });

    const result = await processOrder(prisma as any, { ...mockEnv, TAX_RATE: '0.05' }, {
      ...mockInput,
      items: [{ productId: 'prod-1', quantity: 1, currentPrice: 1000, productName: 'Item' }],
    });

    expect(result.order.tax).toBe(50);
  });

  it('should default TAX_RATE to 0.18 when not set', async () => {
    const prisma = createMockPrisma({
      id: 'order-3', subtotal: 1000, tax: 180, total: 1180,
      status: 'PENDING_WHATSAPP_CONFIRMATION', items: [],
      priceSnapshot: '[]', createdAt: new Date(),
      userId: 'user-1', customerName: 'Test', customerPhone: '+919876543210',
    });

    const result = await processOrder(prisma as any, { ...mockEnv, TAX_RATE: undefined } as any, {
      ...mockInput,
      items: [{ productId: 'prod-1', quantity: 1, currentPrice: 1000, productName: 'Item' }],
    });

    expect(result.order.tax).toBe(180);
  });

  it('should handle multiple items with correct pricing', async () => {
    const multiInput = {
      userId: 'user-1',
      customerName: 'Jane Smith',
      customerPhone: '+919876543211',
      items: [
        { productId: 'prod-1', quantity: 1, currentPrice: 4999, productName: 'Product 1' },
        { productId: 'prod-2', quantity: 3, currentPrice: 1999, productName: 'Product 2' },
      ],
    };

    const mockTx = {
      product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      order: {
        create: vi.fn().mockResolvedValue({
          id: 'order-3', subtotal: 10996, tax: 1979.28, total: 12975.28,
          status: 'PENDING_WHATSAPP_CONFIRMATION', items: [],
          priceSnapshot: '[]', createdAt: new Date(),
          userId: 'user-1', customerName: 'Jane Smith', customerPhone: '+919876543211',
        }),
      },
    };
    const prisma = { $transaction: vi.fn(async (callback: any) => callback(mockTx)) };

    const result = await processOrder(prisma as any, mockEnv, multiInput);

    expect(result.order.subtotal).toBe(10996);
    expect(mockTx.product.updateMany).toHaveBeenCalledTimes(2);
  });
});
