import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../services/adminService.js');
vi.mock('../../lib/prisma.js');
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c, next) => {
    c.set('user', { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN', sessionId: 'session-1' });
    return next();
  }),
  requireAdmin: vi.fn((_c, next) => next()),
  requireRole: () => vi.fn((_c, next) => next()),
}));

import adminRoutes from '../adminRoutes.js';
import * as adminService from '../../services/adminService.js';
import { getPrisma } from '../../lib/prisma.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/admin', adminRoutes);
  app.onError(errorHandler);
  return app;
}

describe('Admin Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    mockPrisma = {
      order: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      product: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
    };
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    mockEnv = { DB: {} as any, KV: {} as any, R2: {} as any };
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard stats', async () => {
      vi.mocked(adminService.getDashboardStats).mockResolvedValue({
        totalOrders: 100, totalRevenue: 50000, totalUsers: 50, totalProducts: 200, recentOrders: [],
      });

      const res = await app.fetch(new Request('http://localhost/api/admin/stats'), mockEnv);

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.totalOrders).toBe(100);
    });
  });

  describe('GET /api/admin/orders', () => {
    it('should return paginated orders', async () => {
      const res = await app.fetch(new Request('http://localhost/api/admin/orders'), mockEnv);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/products', () => {
    it('should return paginated products', async () => {
      const res = await app.fetch(new Request('http://localhost/api/admin/products'), mockEnv);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/admin/products', () => {
    it('should create product', async () => {
      vi.mocked(adminService.createProduct).mockResolvedValue({} as any);

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Product', description: 'A great product description', price: 2999, stock: 10,
            category: 'Electronics', images: ['https://img.jpg'],
          }),
        }),
        mockEnv
      );

      expect(res.status).toBe(201);
    });

    it('should reject invalid product data', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'A' }),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });
  });

  describe('PUT /api/admin/products/:id', () => {
    it('should update product', async () => {
      vi.mocked(adminService.updateProduct).mockResolvedValue({} as any);

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products/prod-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/admin/products/:id', () => {
    it('should delete product', async () => {
      vi.mocked(adminService.deleteProduct).mockResolvedValue({ id: 'prod-1' });

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products/prod-1', {
          method: 'DELETE',
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users', async () => {
      vi.mocked(adminService.getAllUsers).mockResolvedValue({
        users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await app.fetch(new Request('http://localhost/api/admin/users'), mockEnv);

      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    it('should update user role', async () => {
      vi.mocked(adminService.updateUserRole).mockResolvedValue({
        id: 'user-2', name: 'Test', email: 'test@example.com', role: 'ADMIN',
      });

      const res = await app.fetch(
        new Request('http://localhost/api/admin/users/user-2/role', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'ADMIN' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });
});
