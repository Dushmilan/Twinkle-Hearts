import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../services/orderService.js');
vi.mock('../../lib/prisma.js');
vi.mock('../../middleware/validation.js', () => ({
  validateOrder: vi.fn((c, next) => {
    c.set('validatedItems', [{ productId: 'prod-1', quantity: 2, currentPrice: 2999, productName: 'Test', stockAvailable: 10 }]);
    c.set('customerName', 'John Doe');
    c.set('customerPhone', '+919876543210');
    return next();
  }),
  validateCartSync: vi.fn((_c, next) => next()),
}));
vi.mock('../../middleware/rateLimiter.js', () => ({
  orderRateLimit: vi.fn((_c, next) => next()),
  apiLimiter: vi.fn((_c, next) => next()),
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c, next) => {
    c.set('user', { userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER', sessionId: 'session-1' });
    return next();
  }),
}));

import orderRoutes from '../orderRoutes.js';
import * as orderService from '../../services/orderService.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/orders', orderRoutes);
  return app;
}

describe('Order Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockEnv = {
      DB: {} as any, KV: {} as any,
      TAX_RATE: '0.18', WHATSAPP_BUSINESS_NUMBER: '+94771234567',
    };
  });

  describe('POST /api/orders/create', () => {
    it('should create an order and return whatsapp link', async () => {
      vi.mocked(orderService.createOrder).mockResolvedValue({
        id: 'order-1', userId: 'user-1', customerName: 'John Doe', customerPhone: '+919876543210',
        subtotal: 5998, tax: 1079.64, total: 7077.64, status: 'PENDING_WHATSAPP_CONFIRMATION',
        items: [{ productId: 'prod-1', productName: 'Test', quantity: 2, price: 2999 }],
        priceSnapshot: '[]', createdAt: new Date('2026-01-01'),
      } as any);

      const res = await app.fetch(
        new Request('http://localhost/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.orderId).toBe('order-1');
      expect(body.whatsappDeepLink).toContain('wa.me');
    });
  });

  describe('GET /api/orders', () => {
    it('should return user orders', async () => {
      vi.mocked(orderService.getUserOrders).mockResolvedValue({
        orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/orders'),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by id', async () => {
      vi.mocked(orderService.getOrderById).mockResolvedValue({
        id: 'order-1', total: 7077.64, customerName: 'John Doe',
        items: [], createdAt: new Date(),
      } as any);

      const res = await app.fetch(
        new Request('http://localhost/api/orders/order-1'),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.order.id).toBe('order-1');
    });

    it('should return 404 for non-existent order', async () => {
      vi.mocked(orderService.getOrderById).mockResolvedValue(null);

      const res = await app.fetch(
        new Request('http://localhost/api/orders/non-existent'),
        mockEnv
      );

      expect(res.status).toBe(404);
    });
  });
});
