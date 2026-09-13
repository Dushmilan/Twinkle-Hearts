import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

// Mock ONLY the edges: auth, rate limiting, cache, and the product-data seam.
// Validation middleware (validateOrder / validateCartSync) and the order-intake
// pipeline (hydrate + pricing + order create) stay REAL — they are the code
// under test. The prisma mock below is a faithful fake: findMany applies the
// caller's where-clause (id IN [...] AND isActive) the way the DB would.
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
import cartRoutes from '../cartRoutes.js';
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

interface CartSyncBody {
  items: Array<{ productId: string; quantity: number; currentPrice: number }>;
  syncedAt: string;
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

function cartApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/cart', cartRoutes);
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

describe('price tampering', () => {
  it('ignores client-sent unit price on order create', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [{ productId: 'prod-1', quantity: 2, price: 1 }],
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as OrderCreateBody;
    expect(body.subtotal).toBe(5000);
    expect(body.items[0].price).toBe(2500);
    expect(body.tax).toBe(900);
    expect(body.total).toBe(5900);
  });

  it('rejects order for unknown product id', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [{ productId: 'no-such-id', quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('reprices cart sync from DB, ignoring client totals', async () => {
    const res = await postJson(cartApp(), '/api/cart/sync', {
      items: [{ productId: 'prod-1', quantity: 3, price: 5 }],
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as CartSyncBody;
    expect(body.items[0].currentPrice).toBe(2500);
    expect(body.items[0].quantity).toBe(3);
  });

  it('reprices rangoli service bookings from DB', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [{ productId: 'rang-1', quantity: 1, price: 10 }],
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as OrderCreateBody;
    expect(body.subtotal).toBe(4500);
  });

  it('rejects order for inactive product', async () => {
    const res = await postJson(orderApp(), '/api/orders/create', {
      ...CUSTOMER,
      items: [{ productId: 'prod-dead', quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('creates + replays under Idempotency-Key with real validation (no double body-read)', async () => {
    // Real validateOrder consumes the body via c.req.json(); the idempotency
    // path must not re-read it (canonical hash over validated payload) and
    // must replay on retry. Random UUID key also proves the format guard
    // accepts valid keys end-to-end.
    const backing = new Map<string, string>();
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const env = {
      DB: {},
      KV: {
        get: async (k: string): Promise<string | null> => backing.get(k) ?? null,
        put: async (k: string, v: string): Promise<void> => {
          backing.set(k, v);
        },
        delete: async (k: string): Promise<void> => {
          backing.delete(k);
        },
      },
      TAX_RATE: '0.18',
      WHATSAPP_BUSINESS_NUMBER: '94771234567',
    } as unknown as Env;
    const payload = {
      ...CUSTOMER,
      items: [{ productId: 'prod-1', quantity: 2 }],
    };
    const send = (): Promise<Response> =>
      Promise.resolve(
        orderApp().fetch(
          new Request('http://localhost/api/orders/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': key,
            },
            body: JSON.stringify(payload),
          }),
          env,
        ),
      );

    const first = await send();
    expect(first.status).toBe(200);
    const firstJson = (await first.json()) as OrderCreateBody;
    expect(firstJson.subtotal).toBe(5000);
    expect(first.headers.get('Idempotent-Replayed')).toBeNull();

    const second = await send();
    expect(second.status).toBe(200);
    expect((await second.json()) as OrderCreateBody).toEqual(firstJson);
    expect(second.headers.get('Idempotent-Replayed')).toBe('true');
  });
});
