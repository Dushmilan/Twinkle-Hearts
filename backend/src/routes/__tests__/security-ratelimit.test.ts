import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

// Real orderRateLimit under test (NOT mocked). Auth is a fixed user-1 so all
// attempts share the `ratelimit:order:user-1` bucket; validation is stubbed
// to pass through; order creation is stubbed to succeed.
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn(
    (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>,
    ) => {
      c.set('user', {
        userId: 'user-1',
        email: 't@e.com',
        role: 'CUSTOMER',
        sessionId: 's1',
      });
      return next();
    },
  ),
}));

vi.mock('../../middleware/validation.js', () => ({
  validateOrder: vi.fn(
    (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>,
    ) => {
      c.set('validatedItems', [
        {
          productId: 'prod-1',
          quantity: 2,
          currentPrice: 2999,
          productName: 'Test',
        },
      ]);
      c.set('customerName', 'John Doe');
      c.set('customerPhone', '+94771234567');
      return next();
    },
  ),
  validateCartSync: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
}));

vi.mock('../../services/orderService.js', () => ({
  createOrder: vi.fn(),
  getUserOrders: vi.fn(),
  getOrderById: vi.fn(),
}));

import orderRoutes from '../orderRoutes.js';
import * as orderService from '../../services/orderService.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

// Fake KV counting per key, sharing one map across requests to simulate a
// persistent store. Accepts the extra `type` / `options` args the real
// limiter passes to KV.get / KV.put.
function testEnv(counts: Map<string, number>): Env {
  const KV = {
    get: async (key: string, _type?: string): Promise<string | null> =>
      counts.has(key) ? String(counts.get(key)) : null,
    put: async (
      key: string,
      value: string,
      _options?: unknown,
    ): Promise<void> => {
      counts.set(key, parseInt(value, 10));
    },
  };
  return {
    DB: {},
    KV,
    TAX_RATE: '0.18',
    WHATSAPP_BUSINESS_NUMBER: '94771234567',
  } as unknown as Env;
}

type CreateOrderResult = Awaited<ReturnType<typeof orderService.createOrder>>;

function stubSuccessfulOrder(): void {
  vi.mocked(orderService.createOrder).mockResolvedValue({
    id: 'order-1',
    userId: 'user-1',
    customerName: 'John Doe',
    customerPhone: '+94771234567',
    subtotal: 5998,
    tax: 1079.64,
    total: 7077.64,
    status: 'PENDING_WHATSAPP_CONFIRMATION',
    items: [
      { productId: 'prod-1', productName: 'Test', quantity: 2, price: 2999 },
    ],
    priceSnapshot: '[]',
    createdAt: new Date('2026-01-01'),
  } as unknown as CreateOrderResult);
}

describe('order rate limiting (security)', () => {
  it('returns 429 after 5 order attempts in the window', async () => {
    stubSuccessfulOrder();
    const counts = new Map<string, number>();
    const app = new Hono<{ Bindings: Env }>();
    app.route('/api/orders', orderRoutes);
    app.onError(errorHandler);

    const postOrder = async (): Promise<Response> =>
      await app.fetch(
        new Request('http://localhost/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ productId: 'prod-1', quantity: 2 }],
          }),
        }),
        testEnv(counts),
      );

    for (let i = 0; i < 5; i++) {
      const res = await postOrder();
      expect(res.status).toBe(200);
    }

    const limited = await postOrder();
    expect(limited.status).toBe(429);
    expect(counts.get('ratelimit:order:user-1')).toBe(5);
  });
});
