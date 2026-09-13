import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { generateKeyPair, SignJWT, exportPKCS8, exportSPKI } from 'jose';

vi.mock('../../lib/cache/index.js');
vi.mock('../../lib/prisma.js');
vi.mock('../../services/adminService.js');

import { getCacheRepository } from '../../lib/cache/index.js';
import { getPrismaRepository } from '../../lib/prisma.js';
import * as adminService from '../../services/adminService.js';
import adminRoutes from '../adminRoutes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { CacheRepository } from '../../lib/cache/cache-repository.js';
import type { Env, Variables } from '../../types.js';

let signKey: CryptoKey;
let testEnv: Env;

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

const validProductBody = {
  name: 'New Card',
  description: 'A beautiful greeting card for testing',
  price: 1500,
  category: 'Birthday',
  images: ['https://example.com/img.jpg'],
};

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  signKey = pair.privateKey as CryptoKey;
  testEnv = {
    JWT_PRIVATE_KEY: await exportPKCS8(pair.privateKey),
    JWT_PUBLIC_KEY: await exportSPKI(pair.publicKey),
    KV: {},
    DB: {},
  } as unknown as Env;
  vi.mocked(getCacheRepository).mockReturnValue({
    getSession: vi.fn(async () => ({ userId: 'stubbed' })),
  } as unknown as CacheRepository);
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCacheRepository).mockReturnValue({
    getSession: vi.fn(async () => ({ userId: 'stubbed' })),
  } as unknown as CacheRepository);
  vi.mocked(getPrismaRepository).mockReturnValue({
    order: {
      findUnique: vi.fn(async () => null),
      update: vi.fn(async () => null),
    },
  } as unknown as ReturnType<typeof getPrismaRepository>);
});

function createTestApp(): Hono<{ Bindings: Env; Variables: Variables }> {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
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

describe('admin RBAC boundary (real authenticate + requireAdmin)', () => {
  it('forbids product creation by non-admin', async () => {
    const app = createTestApp();
    const token = await mint(CUSTOMER);

    const res = await app.request(
      '/api/admin/products',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validProductBody),
      },
      testEnv,
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(adminService.createProduct)).not.toHaveBeenCalled();
  });

  it('allows product creation by admin', async () => {
    const app = createTestApp();
    const token = await mint(ADMIN);
    const created = {
      id: 'prod-1',
      name: validProductBody.name,
      description: validProductBody.description,
      price: validProductBody.price,
      category: validProductBody.category,
      images: JSON.stringify(validProductBody.images),
      isActive: true,
    };
    vi.mocked(adminService.createProduct).mockResolvedValue(
      created as unknown as Awaited<ReturnType<typeof adminService.createProduct>>,
    );

    const res = await app.request(
      '/api/admin/products',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validProductBody),
      },
      testEnv,
    );

    expect(res.status).toBe(201);
    expect(vi.mocked(adminService.createProduct)).toHaveBeenCalledTimes(1);
  });

  it('forbids order-status change by the ordering user', async () => {
    const app = createTestApp();
    const token = await mint(CUSTOMER);

    const res = await app.request(
      '/api/admin/orders/order-1/status',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      },
      testEnv,
    );

    expect(res.status).toBe(403);
    // Blocked by requireAdmin before the handler, so the order update never runs.
    expect(vi.mocked(getPrismaRepository)).not.toHaveBeenCalled();
  });
});
