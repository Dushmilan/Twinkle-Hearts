import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

// Same proven preamble as security-pricing.test.ts (Task 1): mock ONLY the
// edges — auth, rate limiting, cache, productService, and the product-data
// seam. Validation middleware (validateOrder) and the order-intake pipeline
// (hydrate + pricing + order create) stay REAL — they are the code under test.
// The prisma mock below is a faithful fake: findMany applies the caller's
// where-clause (id IN [...] AND isActive) the way the DB would.
vi.mock('../../lib/prisma.js', () => {
  interface CatalogEntry {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }
  interface FindManyArgs {
    where?: { id?: { in?: string[] }; isActive?: boolean };
  }
  interface ItemCreate {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }
  interface OrderCreateArgs {
    data: {
      userId: string;
      customerName: string;
      customerPhone: string;
      subtotal: number;
      tax: number;
      total: number;
      status: string;
      items: { create: ItemCreate[] };
      priceSnapshot: string;
    };
  }

  const catalog: CatalogEntry[] = [
    { id: 'prod-1', name: 'Real Card', price: 2500, isActive: true },
    { id: 'rang-1', name: 'Lotus Rangoli', price: 4500, isActive: true },
    { id: 'prod-dead', name: 'Dead Card', price: 999, isActive: false },
    // Canned hostile name: must pass through the whole pipeline inertly,
    // echoed back byte-identical, never interpreted.
    { id: 'prod-evil', name: '{"$gt":""}\'; DROP TABLE Product; --', price: 1000, isActive: true },
  ];

  const findMany = vi.fn(
    async (args?: FindManyArgs): Promise<CatalogEntry[]> => {
      const ids = args?.where?.id?.in ?? [];
      const onlyActive = args?.where?.isActive;
      return catalog.filter(
        (p) =>
          ids.includes(p.id) &&
          (onlyActive === undefined || p.isActive === onlyActive),
      );
    },
  );

  const orderCreate = vi.fn(async (args: OrderCreateArgs) => {
    const d = args.data;
    return {
      id: 'order-1',
      userId: d.userId,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      subtotal: d.subtotal,
      tax: d.tax,
      total: d.total,
      status: d.status,
      items: d.items.create.map((item, index) => ({
        id: `item-${index}`,
        orderId: 'order-1',
        ...item,
      })),
      priceSnapshot: d.priceSnapshot,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
  });

  const tx = { order: { create: orderCreate } };
  const repo = {
    product: { findMany },
    order: { create: orderCreate },
    $transaction: vi.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };

  return {
    getPrismaRepository: vi.fn(() => repo),
    getPrisma: vi.fn(() => repo),
    default: vi.fn(() => repo),
  };
});
vi.mock('../../lib/cache/index.js', () => ({
  getCacheRepository: vi.fn(() => ({
    delete: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
  })),
  CacheKeys: { userOrders: (userId: string) => `user:orders:${userId}` },
}));
vi.mock('../../middleware/rateLimiter.js', () => ({
  orderRateLimit: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
  apiLimiter: vi.fn((_c: unknown, next: () => Promise<void>) => next()),
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { userId: 'user-1', email: 't@e.com', role: 'CUSTOMER', sessionId: 's1' });
    return next();
  }),
}));
import orderRoutes from '../orderRoutes.js';
import { getPrismaRepository } from '../../lib/prisma.js';
import { hydrateOrderItems } from '../../lib/validators/index.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

interface OrderCreateBody {
  orderId: string;
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  whatsappDeepLink: string;
  createdAt: string;
}

function testEnv(): Env {
  return {
    DB: {},
    KV: {},
    TAX_RATE: '0.18',
    WHATSAPP_BUSINESS_NUMBER: '94771234567',
  } as unknown as Env;
}

function orderApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/orders', orderRoutes);
  app.onError(errorHandler);
  return app;
}

const postJson = async (
  app: Hono<{ Bindings: Env }>,
  path: string,
  body: unknown,
): Promise<Response> =>
  app.fetch(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    testEnv(),
  );

const CUSTOMER = { customerName: 'Test Buyer', customerPhone: '+94771234567' };
const EVIL_NAME = '{"$gt":""}\'; DROP TABLE Product; --';

describe('validation edges', () => {
  it('rejects zero and negative quantities', async () => {
    for (const quantity of [0, -1, -999]) {
      const res = await postJson(orderApp(), '/api/orders/create', {
        ...CUSTOMER,
        items: [{ productId: 'prod-1', quantity }],
      });
      expect([400, 422]).toContain(res.status);
    }
  });

  it('rejects empty items array', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [],
    });
    expect([400, 422]).toContain(res.status);
  });

  it('rejects malformed JSON without leaking internals', async () => {
    const res = await orderApp().fetch(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }),
      testEnv(),
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    const text = await res.text();
    expect(text).not.toMatch(/prisma|stack|at\s+\w+\s+\(/i);
  });

  it('passes special characters through inertly', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [{ productId: 'prod-evil', quantity: 1 }],
    });
    // No Idempotency-Key sent; initial creation returns 200 (see Task 5).
    expect(res.status).toBe(200);
    const body = (await res.json()) as OrderCreateBody;
    expect(body.items[0].productName).toBe(EVIL_NAME);

    // The catalog query path is unharmed: a second real-hydrate read through
    // the same findMany seam round-trips the evil name byte-identical.
    const reread = await hydrateOrderItems(getPrismaRepository(testEnv().DB), [
      { productId: 'prod-evil', quantity: 2 },
    ]);
    expect(reread[0].productName).toBe(EVIL_NAME);
  });
});
