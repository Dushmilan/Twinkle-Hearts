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
import { getPrisma, getPrismaRepository } from '../../lib/prisma.js';
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
    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

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
            name: 'New Product', description: 'A great product description', price: 2999,
            productType: 'card', images: ['https://img.jpg'],
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

  describe('POST /api/admin/products/upload', () => {
    it('should reject uploads with no files', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/admin/products/upload', {
          method: 'POST',
          body: new FormData(),
        }),
        mockEnv
      );

      expect(res.status).toBe(400);
    });

    it('should upload images and return urls', async () => {
      vi.mocked(adminService.uploadProductImages).mockResolvedValue({ urls: ['k.jpg'], count: 1 });
      const form = new FormData();
      form.append('images', 'placeholder');

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products/upload', { method: 'POST', body: form }),
        mockEnv
      );

      expect(res.status).toBe(200);
      expect(adminService.uploadProductImages).toHaveBeenCalled();
    });

    it('should parse stringified image arrays in the product schema', async () => {
      vi.mocked(adminService.createProduct).mockResolvedValue({} as Awaited<ReturnType<typeof adminService.createProduct>>);

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'String Images', description: 'A great product description', price: 999,
            productType: 'card', images: JSON.stringify(['a.jpg']),
          }),
        }),
        mockEnv
      );

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    it('should return the order with items and user', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue({ id: 'o1', items: [] });

      const res = await app.fetch(new Request('http://localhost/api/admin/orders/o1'), mockEnv);

      expect(res.status).toBe(200);
    });

    it('should 404 for an unknown order', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue(null);

      const res = await app.fetch(new Request('http://localhost/api/admin/orders/nope'), mockEnv);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/orders/:id/status', () => {
    const putStatus = (id: string, status: string) =>
      app.fetch(
        new Request(`http://localhost/api/admin/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }),
        mockEnv
      );

    it('should update to a valid status', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue({ id: 'o1', status: 'PENDING_WHATSAPP_CONFIRMATION' });
      mockPrisma.order.update = vi.fn().mockResolvedValue({ id: 'o1', status: 'CONFIRMED' });

      const res = await putStatus('o1', 'CONFIRMED');

      expect(res.status).toBe(200);
    });

    it('should reject an invalid status', async () => {
      const res = await putStatus('o1', 'FROBNICATED');

      expect(res.status).toBe(400);
    });

    it('should 404 for an unknown order', async () => {
      mockPrisma.order.findUnique = vi.fn().mockResolvedValue(null);

      const res = await putStatus('nope', 'CONFIRMED');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/products with search', () => {
    it('should filter by name or description', async () => {
      mockPrisma.product.findMany = vi.fn().mockResolvedValue([{ id: 'p1', images: '[]' }]);
      mockPrisma.product.count = vi.fn().mockResolvedValue(1);

      const res = await app.fetch(
        new Request('http://localhost/api/admin/products?search=birthday'),
        mockEnv
      );

      expect(res.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
      );
      const body = (await res.json()) as { data: { products: Array<{ images: string[] }> } };
      expect(body.data.products[0].images).toEqual([]);
    });
  });
});
