import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { hashRequestBody } from '../../lib/idempotency/idempotency-store.js';

vi.mock('../../middleware/rateLimiter.js', () => ({
  orderRateLimit: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
  apiLimiter: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
}));

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

const created: string[] = [];
vi.mock('../../services/orderService.js', () => ({
  createOrder: vi.fn(async () => {
    const id = `o-${created.length + 1}`;
    created.push(id);
    return {
      id,
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
    };
  }),
  getUserOrders: vi.fn(),
  getOrderById: vi.fn(),
}));

import orderRoutes from '../orderRoutes.js';
import * as orderService from '../../services/orderService.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

// Fake KV sharing one map across requests to simulate a persistent store.
// Accepts the extra `type` / `options` args the route passes to KV.get / KV.put.
function testEnv(store: Map<string, string>): Env {
  const KV = {
    get: async (key: string, _type?: string): Promise<string | null> =>
      store.has(key) ? (store.get(key) as string) : null,
    put: async (
      key: string,
      value: string,
      _options?: unknown,
    ): Promise<void> => {
      store.set(key, value);
    },
    delete: async (key: string): Promise<void> => {
      store.delete(key);
    },
  };
  return {
    DB: {},
    KV,
    TAX_RATE: '0.18',
    WHATSAPP_BUSINESS_NUMBER: '94771234567',
  } as unknown as Env;
}

const orderBody = (quantity: number): string =>
  JSON.stringify({
    items: [{ productId: 'prod-1', quantity }],
    customerName: 'John Doe',
    customerPhone: '+94771234567',
  });

describe('order idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    created.length = 0;
  });

  function testApp(): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    app.route('/api/orders', orderRoutes);
    app.onError(errorHandler);
    return app;
  }

  async function postOrder(
    app: Hono<{ Bindings: Env }>,
    store: Map<string, string>,
    body: string,
    key?: string,
    env?: Env,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key !== undefined) headers['Idempotency-Key'] = key;
    return app.fetch(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers,
        body,
      }),
      env ?? testEnv(store),
    );
  }

  interface OrderResponseBody {
    orderId: string;
    items: Array<{ productId: string; productName: string; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    total: number;
    whatsappDeepLink: string;
    createdAt: string;
  }

  it('replays the same order for the same key + payload', async () => {
    const store = new Map<string, string>();
    const app = testApp();
    const key = randomUUID();
    const body = orderBody(1);

    const first = await postOrder(app, store, body, key);
    expect(first.status).toBe(200);
    const firstJson = (await first.json()) as OrderResponseBody;
    expect(firstJson.orderId).toBe('o-1');
    expect(firstJson.whatsappDeepLink).toContain('wa.me');
    expect(first.headers.get('Idempotent-Replayed')).toBeNull();

    const second = await postOrder(app, store, body, key);
    expect(second.status).toBe(200);
    const secondJson = (await second.json()) as OrderResponseBody;
    expect(secondJson).toEqual(firstJson);
    expect(second.headers.get('Idempotent-Replayed')).toBe('true');
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(1);
  });

  it('rejects same key with different payload', async () => {
    const store = new Map<string, string>();
    const app = testApp();
    const key = randomUUID();

    const first = await postOrder(app, store, orderBody(1), key);
    expect(first.status).toBe(200);

    const second = await postOrder(app, store, orderBody(2), key);
    expect(second.status).toBe(422);
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(1);
  });

  it('creates only one order under concurrent double-submit', async () => {
    const store = new Map<string, string>();
    const app = testApp();
    const key = randomUUID();
    const body = orderBody(1);

    const [a, b] = await Promise.all([
      postOrder(app, store, body, key),
      postOrder(app, store, body, key),
    ]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const aJson = (await a.json()) as { orderId: string };
    const bJson = (await b.json()) as { orderId: string };
    expect(aJson.orderId).toBe(bJson.orderId);
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(1);
  });

  it('deletes the marker on failure so a same-key retry succeeds', async () => {
    const store = new Map<string, string>();
    const app = testApp();
    const key = randomUUID();
    const body = orderBody(1);

    vi.mocked(orderService.createOrder).mockRejectedValueOnce(new Error('db down'));
    const failed = await postOrder(app, store, body, key);
    expect(failed.status).toBe(500);

    const retry = await postOrder(app, store, body, key);
    expect(retry.status).toBe(200);
    const retryJson = (await retry.json()) as OrderResponseBody;
    expect(retryJson.orderId).toBe('o-1');
    expect(retryJson.whatsappDeepLink).toContain('wa.me');
    expect(retry.headers.get('Idempotent-Replayed')).toBeNull();
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(2);
  });

  it('creates when the pending marker vanishes mid-wait', async () => {
    const backing = new Map<string, string>();
    const app = testApp();
    const key = randomUUID();
    const body = orderBody(1);
    const kvKey = `idempotency:order:user-1:${key}`;
    // Seed a pending marker as a crashed leader would have left it.
    backing.set(
      kvKey,
      JSON.stringify({ requestHash: hashRequestBody(body), statusCode: 200, pending: true }),
    );
    // First read sees pending; the second read sees null (failed leader deleted
    // it); later reads behave normally against the backing map.
    let reads = 0;
    const KV = {
      get: async (k: string, _type?: string): Promise<string | null> => {
        if (k === kvKey) {
          reads += 1;
          if (reads === 2) return null;
        }
        return backing.has(k) ? (backing.get(k) as string) : null;
      },
      put: async (k: string, value: string, _options?: unknown): Promise<void> => {
        backing.set(k, value);
      },
      delete: async (k: string): Promise<void> => {
        backing.delete(k);
      },
    };
    const env = {
      DB: {},
      KV,
      TAX_RATE: '0.18',
      WHATSAPP_BUSINESS_NUMBER: '94771234567',
    } as unknown as Env;

    const res = await postOrder(app, backing, body, key, env);
    expect(res.status).toBe(200);
    const resJson = (await res.json()) as OrderResponseBody;
    expect(resJson.orderId).toBe('o-1');
    expect(resJson.whatsappDeepLink).toContain('wa.me');
    expect(res.headers.get('Idempotent-Replayed')).toBeNull();
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(1);

    // The recovered attempt stored a completed result: same key replays it.
    const replay = await postOrder(app, backing, body, key, env);
    expect(replay.status).toBe(200);
    expect((await replay.json()) as OrderResponseBody).toEqual(resJson);
    expect(replay.headers.get('Idempotent-Replayed')).toBe('true');
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(1);
  });

  it('ignores idempotency when no key is sent', async () => {
    const store = new Map<string, string>();
    const app = testApp();
    const body = orderBody(1);

    const first = await postOrder(app, store, body);
    const second = await postOrder(app, store, body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstJson = (await first.json()) as { orderId: string };
    const secondJson = (await second.json()) as { orderId: string };
    expect(firstJson.orderId).not.toBe(secondJson.orderId);
    expect(vi.mocked(orderService.createOrder)).toHaveBeenCalledTimes(2);
  });
});
