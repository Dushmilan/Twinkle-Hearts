import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../services/userService.js');
vi.mock('../../services/orderService.js');
vi.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: vi.fn((_c, next) => next()),
  orderRateLimit: vi.fn((_c, next) => next()),
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c, next) => {
    c.set('user', { userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER', sessionId: 'session-1' });
    return next();
  }),
}));

import userRoutes from '../userRoutes.js';
import * as userService from '../../services/userService.js';
import * as orderService from '../../services/orderService.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/users', userRoutes);
  app.onError(errorHandler);
  return app;
}

describe('User Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockEnv = { DB: {} as any, KV: {} as any };
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile', async () => {
      vi.mocked(userService.getUserProfile).mockResolvedValue({
        id: 'user-1', email: 'test@example.com', name: 'Test', phone: null,
        avatar: null, role: 'CUSTOMER', emailVerified: true,
        createdAt: new Date(), lastLoginAt: null,
        _count: { orders: 0, addresses: 1, wishlist: 0 },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/users/profile'),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile', async () => {
      vi.mocked(userService.updateUserProfile).mockResolvedValue({
        id: 'user-1', email: 'test@example.com', name: 'Updated', phone: null,
        avatar: null, role: 'CUSTOMER',
      });

      const res = await app.fetch(
        new Request('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should change password', async () => {
      vi.mocked(userService.changePassword).mockResolvedValue(undefined);

      const res = await app.fetch(
        new Request('http://localhost/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: 'OldP@ss1', newPassword: 'NewP@ss1' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('should reject short new password', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: 'OldP@ss1', newPassword: 'Short1!' }),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });
  });

  describe('GET /api/users/orders', () => {
    it('should return user orders', async () => {
      vi.mocked(orderService.getUserOrders).mockResolvedValue({
        orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/users/orders'),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Address endpoints', () => {
    it('GET /api/users/addresses should return addresses', async () => {
      vi.mocked(userService.getUserAddresses).mockResolvedValue([]);

      const res = await app.fetch(
        new Request('http://localhost/api/users/addresses'),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('POST /api/users/addresses should create address', async () => {
      vi.mocked(userService.createAddress).mockResolvedValue({ id: 'addr-1', label: 'Home', street: '123 St', city: 'Colombo', state: 'Western', zip: '00100', country: 'LK', phone: '+949876543210', isDefault: true, userId: 'user-1', type: 'HOME', createdAt: new Date(), updatedAt: new Date() });

      const res = await app.fetch(
        new Request('http://localhost/api/users/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Home', street: '123 St', city: 'Colombo', state: 'Western', zip: '00100', phone: '+949876543210' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(201);
    });

    it('PUT /api/users/addresses/:id should update address', async () => {
      vi.mocked(userService.updateAddress).mockResolvedValue({ id: 'addr-1', label: 'Work' } as any);

      const res = await app.fetch(
        new Request('http://localhost/api/users/addresses/addr-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: 'Work' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('DELETE /api/users/addresses/:id should delete address', async () => {
      vi.mocked(userService.deleteAddress).mockResolvedValue(undefined);

      const res = await app.fetch(
        new Request('http://localhost/api/users/addresses/addr-1', {
          method: 'DELETE',
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Wishlist endpoints', () => {
    it('GET /api/users/wishlist should return wishlist', async () => {
      vi.mocked(userService.getUserWishlist).mockResolvedValue([]);

      const res = await app.fetch(
        new Request('http://localhost/api/users/wishlist'),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('POST /api/users/wishlist/:productId should add to wishlist', async () => {
      vi.mocked(userService.addToWishlist).mockResolvedValue({ id: 'wish-1', productId: 'prod-1', product: { id: 'prod-1', name: 'Test', price: 100, images: [], stock: 10 } } as any);

      const res = await app.fetch(
        new Request('http://localhost/api/users/wishlist/prod-1', {
          method: 'POST',
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('DELETE /api/users/wishlist/:productId should remove from wishlist', async () => {
      vi.mocked(userService.removeFromWishlist).mockResolvedValue(undefined);

      const res = await app.fetch(
        new Request('http://localhost/api/users/wishlist/prod-1', {
          method: 'DELETE',
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });
});
