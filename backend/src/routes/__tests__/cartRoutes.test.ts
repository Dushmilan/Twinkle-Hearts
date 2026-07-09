import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../lib/prisma.js');
vi.mock('../../middleware/validation.js', () => ({
  validateCartSync: vi.fn((c, next) => {
    c.set('validatedItems', [
      { productId: 'prod-1', quantity: 2, currentPrice: 100, inStock: true },
    ]);
    return next();
  }),
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c, next) => {
    c.set('user', { userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER', sessionId: 'session-1' });
    return next();
  }),
}));

import cartRoutes from '../cartRoutes.js';
import { getPrisma } from '../../lib/prisma.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/cart', cartRoutes);
  app.onError(errorHandler);
  return app;
}

describe('Cart Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockEnv = { DB: {} as any, KV: {} as any };
  });

  describe('POST /api/cart/sync', () => {
    it('should sync cart items', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
          }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.items).toBeDefined();
      expect(body.syncedAt).toBeDefined();
    });

    it('should handle empty cart gracefully', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [] }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });
});
