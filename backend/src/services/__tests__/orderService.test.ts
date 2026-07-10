import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache/index.js');
vi.mock('../../lib/order-intake/index.js');

import { getPrisma, getPrismaRepository } from '../../lib/prisma.js';
import { getCacheRepository } from '../../lib/cache/index.js';
import * as orderIntake from '../../lib/order-intake/index.js';
import { createOrder, getOrderById, getUserOrders } from '../orderService.js';
import { StockUnavailableError } from '../../middleware/errorHandler.js';

describe('orderService', () => {
  let mockPrisma: any;
  let mockEnv: any;
  let mockCache: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getCacheRepository).mockReturnValue(mockCache as any);

    mockPrisma = {
      $transaction: vi.fn(),
      product: { updateMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
      order: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    };

    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
      TAX_RATE: '0.18',
    } as any;
  });

  describe('createOrder', () => {
    const orderInput = {
      userId: 'user-1',
      customerName: 'John Doe',
      customerPhone: '+919876543210',
      items: [
        { productId: 'prod-1', quantity: 2, currentPrice: 2999, productName: 'Test Product' },
      ],
    };

    it('should create an order successfully', async () => {
      vi.mocked(orderIntake.processOrder).mockResolvedValue({
        order: {
          id: 'order-1',
          customerName: 'John Doe',
          customerPhone: '+919876543210',
          subtotal: 5998,
          tax: 1079.64,
          total: 7077.64,
          status: 'PENDING_WHATSAPP_CONFIRMATION',
          items: [{ productId: 'prod-1', productName: 'Test Product', quantity: 2, price: 2999 }],
          createdAt: new Date(),
        },
        whatsappDeepLink: 'https://wa.me/+94771234567?text=...',
      });

      const result = await createOrder(mockEnv, orderInput);

      expect(result.id).toBe('order-1');
      expect(result.subtotal).toBe(5998);
      expect(result.total).toBe(7077.64);
      expect(result.status).toBe('PENDING_WHATSAPP_CONFIRMATION');
      expect(orderIntake.processOrder).toHaveBeenCalledWith(mockPrisma, mockEnv, orderInput);
      expect(mockCache.delete).toHaveBeenCalled();
    });

    it('should pass env TAX_RATE to facade', async () => {
      mockEnv.TAX_RATE = '0.05';
      vi.mocked(orderIntake.processOrder).mockResolvedValue({
        order: { id: 'order-2', subtotal: 1000, tax: 50, total: 1050, status: 'PENDING_WHATSAPP_CONFIRMATION', items: [], createdAt: new Date(), customerName: 'John Doe', customerPhone: '+919876543210' },
        whatsappDeepLink: '',
      });

      const result = await createOrder(mockEnv, {
        ...orderInput,
        items: [{ productId: 'prod-1', quantity: 1, currentPrice: 1000, productName: 'Item' }],
      });

      expect(result.tax).toBe(50);
      expect(orderIntake.processOrder).toHaveBeenCalledWith(mockPrisma, mockEnv, expect.any(Object));
    });

    it('should throw if facade throws', async () => {
      vi.mocked(orderIntake.processOrder).mockRejectedValue(new StockUnavailableError('Insufficient stock'));

      await expect(createOrder(mockEnv, orderInput)).rejects.toThrow(StockUnavailableError);
    });

    it('should handle multiple items', async () => {
      const multiItemInput = {
        userId: 'user-1',
        customerName: 'Jane Smith',
        customerPhone: '+919876543211',
        items: [
          { productId: 'prod-1', quantity: 1, currentPrice: 4999, productName: 'Product 1' },
          { productId: 'prod-2', quantity: 3, currentPrice: 1999, productName: 'Product 2' },
        ],
      };

      vi.mocked(orderIntake.processOrder).mockResolvedValue({
        order: { id: 'order-3', subtotal: 10996, tax: 1979.28, total: 12975.28, status: 'PENDING_WHATSAPP_CONFIRMATION', items: [], createdAt: new Date(), customerName: 'Jane Smith', customerPhone: '+919876543211' },
        whatsappDeepLink: '',
      });

      const result = await createOrder(mockEnv, multiItemInput);

      expect(result.subtotal).toBe(10996);
      expect(orderIntake.processOrder).toHaveBeenCalledWith(mockPrisma, mockEnv, multiItemInput);
    });

    it('should handle empty TAX_RATE by defaulting to 0.18', async () => {
      mockEnv.TAX_RATE = undefined;
      vi.mocked(orderIntake.processOrder).mockResolvedValue({
        order: { id: 'order-4', subtotal: 1000, tax: 180, total: 1180, status: 'PENDING_WHATSAPP_CONFIRMATION', items: [], createdAt: new Date(), customerName: 'John Doe', customerPhone: '+919876543210' },
        whatsappDeepLink: '',
      });

      const result = await createOrder(mockEnv, {
        ...orderInput,
        items: [{ productId: 'prod-1', quantity: 1, currentPrice: 1000, productName: 'Item' }],
      });

      expect(result.tax).toBe(180);
    });
  });

  describe('getOrderById', () => {
    it('should return order with items', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', userId: 'user-1', items: [] });

      const result = await getOrderById(mockEnv, 'order-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1', userId: 'user-1' },
        include: { items: true },
      });
    });

    it('should return null if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await getOrderById(mockEnv, 'non-existent', 'user-1');

      expect(result).toBeNull();
    });

    it('should not return order for different user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await getOrderById(mockEnv, 'order-1', 'other-user');

      expect(result).toBeNull();
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1', userId: 'other-user' } })
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return paginated orders for user', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 'order-1', subtotal: 1000, tax: 180, total: 1180, status: 'PENDING_WHATSAPP_CONFIRMATION', items: [], createdAt: new Date() },
      ]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await getUserOrders(mockEnv, 'user-1', 1, 20);

      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should return cached orders if available', async () => {
      const cachedOrders = { orders: [{ id: 'order-1' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
      vi.mocked(mockCache.get).mockResolvedValue(cachedOrders);

      const result = await getUserOrders(mockEnv, 'user-1', 1, 20);

      expect(result).toEqual(cachedOrders);
      expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
    });

    it('should handle empty order list', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const result = await getUserOrders(mockEnv, 'user-new', 1, 20);

      expect(result.orders).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.order.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: `order-${i}`, subtotal: 1000, tax: 180, total: 1180,
          status: 'PENDING_WHATSAPP_CONFIRMATION', items: [], createdAt: new Date(),
        }))
      );
      mockPrisma.order.count.mockResolvedValue(5);

      const result = await getUserOrders(mockEnv, 'user-1', 1, 2);

      expect(result.orders).toHaveLength(5);
      expect(result.pagination.totalPages).toBe(3);
    });
  });
});
