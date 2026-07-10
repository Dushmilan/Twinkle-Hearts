import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../services/productService.js');

import productRoutes from '../productRoutes.js';
import * as productService from '../../services/productService.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/products', productRoutes);
  app.onError(errorHandler);
  return app;
}

describe('Product Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockEnv = { DB: {} as any, KV: {} as any };
  });

  describe('GET /api/products', () => {
    it('should return product list with pagination', async () => {
      vi.mocked(productService.productService.listProducts).mockResolvedValue({
        products: [{ id: 'prod-1', name: 'Test', description: 'Desc', price: 100, stock: 10, category: 'Cat', images: [], createdAt: new Date() }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/products'),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.products).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it('should pass query params to service', async () => {
      vi.mocked(productService.productService.listProducts).mockResolvedValue({
        products: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      });

      await app.fetch(
        new Request('http://localhost/api/products?page=2&limit=10&search=test&category=Electronics'),
        mockEnv
      );

      expect(productService.productService.listProducts).toHaveBeenCalledWith(
        mockEnv,
        expect.objectContaining({ page: 2, limit: 10, search: 'test', category: 'Electronics', activeOnly: true })
      );
    });
  });

  describe('GET /api/products/search', () => {
    it('should return search results', async () => {
      vi.mocked(productService.productService.searchProducts).mockResolvedValue([]);

      const res = await app.fetch(
        new Request('http://localhost/api/products/search?q=test'),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('should return empty for short query', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/products/search?q=a'),
        mockEnv
      );

      const body: any = await res.json();
      expect(body.products).toEqual([]);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a product by id', async () => {
      vi.mocked(productService.productService.getProductById).mockResolvedValue({
        id: 'prod-1', name: 'Test Product', description: 'Desc', price: 2999,
        stock: 10, images: [], category: 'Cat', isActive: true, createdAt: new Date(),
      });

      const res = await app.fetch(
        new Request('http://localhost/api/products/prod-1'),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.product.id).toBe('prod-1');
    });

    it('should pass activeOnly: true', async () => {
      vi.mocked(productService.productService.getProductById).mockRejectedValue(new Error('Not found'));

      const res = await app.fetch(
        new Request('http://localhost/api/products/prod-1'),
        mockEnv
      );

      expect(productService.productService.getProductById).toHaveBeenCalledWith(mockEnv, 'prod-1', true);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/products/nonexistent/route'),
        mockEnv
      );

      expect(res.status).toBe(404);
    });
  });
});
