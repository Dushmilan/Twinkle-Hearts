import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { generateKeyPair, SignJWT, exportPKCS8, exportSPKI } from 'jose';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache/index.js', () => ({
  CacheKeys: { userOrders: (userId: string): string => `user-orders:${userId}` },
  getCacheRepository: vi.fn(),
}));

import { getCacheRepository } from '../../lib/cache/index.js';
import type { CacheRepository } from '../../lib/cache/cache-repository.js';
import { getPrismaRepository } from '../../lib/prisma.js';
import orderRoutes from '../orderRoutes.js';
import adminRoutes from '../adminRoutes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env, Variables } from '../../types.js';

// --- Inline in-memory fakes (no imports from backend/tests/helpers) ---

interface FakeOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface FakeOrderRecord {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  priceSnapshot: string;
  items: FakeOrderItem[];
  createdAt: Date;
}

interface OrderCreateData {
  userId: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  priceSnapshot: string;
  items: { create: FakeOrderItem[] };
}

interface TxLike {
  order: { create: (args: { data: OrderCreateData }) => Promise<FakeOrderRecord> };
}

const createdOrders: FakeOrderRecord[] = [];
let nextOrderSeq = 1000;

const CUSTOMER = {
  userId: 'customer-1',
  email: 'customer@example.com',
  role: 'CUSTOMER',
  sessionId: 'sess-customer',
};

const ADMIN = {
  userId: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  sessionId: 'sess-admin',
};

let signKey: CryptoKey;
let testEnv: Env;

const kvStub = {
  get: async (_key: string): Promise<null> => null,
  put: async (_key: string, _value: string): Promise<void> => undefined,
  delete: async (_key: string): Promise<void> => undefined,
};

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  signKey = pair.privateKey as CryptoKey;
  testEnv = {
    JWT_PRIVATE_KEY: await exportPKCS8(pair.privateKey),
    JWT_PUBLIC_KEY: await exportSPKI(pair.publicKey),
    WHATSAPP_BUSINESS_NUMBER: '94771234567',
    TAX_RATE: '0.18',
    KV: kvStub,
    DB: {},
  } as unknown as Env;
});

beforeEach(() => {
  vi.clearAllMocks();
  createdOrders.length = 0;
  nextOrderSeq = 1000;

  vi.mocked(getCacheRepository).mockReturnValue({
    getSession: vi.fn(async () => ({ userId: 'stubbed' })),
    delete: vi.fn(async () => undefined),
  } as unknown as CacheRepository);

  const products = [{ id: 'prod-love', name: 'Love & Care Card', price: 2500, isActive: true }];

  const orderCreate = async ({ data }: { data: OrderCreateData }): Promise<FakeOrderRecord> => {
    // Short uppercase id so it round-trips through the formatter's
    // `order.id.slice(0, 8).toUpperCase()` short-id display verbatim.
    nextOrderSeq += 1;
    const record: FakeOrderRecord = {
      id: `TH-${nextOrderSeq}`,
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: data.status,
      priceSnapshot: data.priceSnapshot,
      items: data.items.create.map((item) => ({ ...item })),
      createdAt: new Date(),
    };
    createdOrders.push(record);
    return record;
  };

  const txLike: TxLike = { order: { create: orderCreate } };

  const findUnique = vi.fn(async (args: { where: { id: string } }): Promise<FakeOrderRecord | null> => {
    return createdOrders.find((o) => o.id === args.where.id) ?? null;
  });
  const update = vi.fn(async (args: { where: { id: string }; data: { status: string } }): Promise<FakeOrderRecord> => {
    const existing = createdOrders.find((o) => o.id === args.where.id);
    if (!existing) throw new Error('Order not found');
    existing.status = args.data.status;
    return existing;
  });

  const fakePrisma = {
    product: { findMany: vi.fn(async () => products) },
    order: { findUnique, update, create: orderCreate },
    $transaction: <T>(fn: (tx: TxLike) => Promise<T>): Promise<T> => fn(txLike),
  };
  vi.mocked(getPrismaRepository).mockReturnValue(
    fakePrisma as unknown as ReturnType<typeof getPrismaRepository>,
  );
});

function createTestApp(): Hono<{ Bindings: Env; Variables: Variables }> {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.route('/api/orders', orderRoutes);
  app.route('/api/admin', adminRoutes);
  app.onError(errorHandler);
  return app;
}

function mint(user: typeof CUSTOMER): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    role: user.role,
    sessionId: user.sessionId,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(user.userId)
    .setExpirationTime('5m')
    .sign(signKey);
}

function createOrderBody() {
  return {
    items: [{ productId: 'prod-love', quantity: 1 }],
    customerName: 'Amara Perera',
    customerPhone: '+94771234567',
  };
}

describe('order lifecycle', () => {
  it('creates orders in PENDING_WHATSAPP_CONFIRMATION', async () => {
    const app = createTestApp();
    const token = await mint(CUSTOMER);

    const res = await app.request(
      '/api/orders/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createOrderBody()),
      },
      testEnv,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { orderId: string };
    expect(body.orderId).toBeTruthy();

    // Real order-intake service persisted the PENDING default (response shape has no status field).
    expect(createdOrders).toHaveLength(1);
    expect(createdOrders[0].status).toBe('PENDING_WHATSAPP_CONFIRMATION');
    expect(String(createdOrders[0].id)).toBe(String(body.orderId));
  });

  it('returns a wa.me link containing the order id', async () => {
    const app = createTestApp();
    const token = await mint(CUSTOMER);

    const res = await app.request(
      '/api/orders/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createOrderBody()),
      },
      testEnv,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { orderId: string; whatsappDeepLink: string };
    expect(body.whatsappDeepLink).toMatch(/^https:\/\/wa\.me\//);
    // '&' and spaces in 'Love & Care Card' must be percent-encoded in the raw link.
    expect(body.whatsappDeepLink).toContain(encodeURIComponent('Love & Care Card'));
    const decoded = decodeURIComponent(body.whatsappDeepLink);
    expect(decoded).toContain(String(body.orderId));
    expect(decoded).toContain('Love & Care Card');
  });

  it('rejects unknown status values on admin update', async () => {
    const app = createTestApp();
    const token = await mint(ADMIN);

    const res = await app.request(
      '/api/admin/orders/order-1/status',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'PAID_AND_SHIPPED_LOL' }),
      },
      testEnv,
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Invalid status');
  });
});
