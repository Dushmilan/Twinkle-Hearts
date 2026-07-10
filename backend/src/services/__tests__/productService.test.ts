import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache.js');

import { getPrisma } from '../../lib/prisma.js';
import * as cacheLib from '../../lib/cache.js';
import { productService } from '../productService.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

describe('productService', () => {
  let mockPrisma: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      product: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    };

    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
    } as any;

    vi.mocked(cacheLib.cacheGet).mockResolvedValue(null);
    vi.mocked(cacheLib.cacheSet).mockResolvedValue(undefined);
  });

  describe('listProducts', () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Product 1', description: 'Desc 1', price: 100, stock: 10, category: 'Cat1', images: [], isActive: true, createdAt: new Date() },
    ];

    it('should return paginated product list', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await productService.listProducts(mockEnv, { page: 1, limit: 20, activeOnly: true });

      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 20,
        })
      );
    });

    it('should return cached results if available', async () => {
      const cached = { products: mockProducts, pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(cached);

      const result = await productService.listProducts(mockEnv, { page: 1, limit: 20 });

      expect(result).toEqual(cached);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should filter by search query', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await productService.listProducts(mockEnv, { page: 1, limit: 20, search: 'test' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test' } },
              { description: { contains: 'test' } },
            ],
          },
        })
      );
    });

    it('should filter by category', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await productService.listProducts(mockEnv, { page: 1, limit: 20, category: 'Electronics' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'Electronics' },
        })
      );
    });

    it('should check activeOnly flag', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await productService.listProducts(mockEnv, { page: 1, limit: 20, activeOnly: false });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: false } })
      );
    });

    it('should cache the result', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      await productService.listProducts(mockEnv, { page: 1, limit: 20, activeOnly: true });

      expect(cacheLib.cacheSet).toHaveBeenCalled();
    });
  });

  describe('searchProducts', () => {
    it('should search by name and description', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await productService.searchProducts(mockEnv, 'query');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'query' } },
              { description: { contains: 'query' } },
            ],
          },
          take: 20,
        })
      );
    });

    it('should respect custom limit', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await productService.searchProducts(mockEnv, 'query', 5);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe('getProductById', () => {
    const mockProduct = { id: 'prod-1', name: 'Test Product', description: 'Test description', price: 2999, stock: 10, images: [], category: 'Cat1', isActive: true, createdAt: new Date() };

    it('should return product by id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productService.getProductById(mockEnv, 'prod-1');

      expect(result).toEqual(mockProduct);
      expect(cacheLib.cacheSet).toHaveBeenCalled();
    });

    it('should return cached product', async () => {
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(mockProduct);

      const result = await productService.getProductById(mockEnv, 'prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(productService.getProductById(mockEnv, 'unknown')).rejects.toThrow(NotFoundError);
    });

    it('should check activeOnly against cached product', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(inactiveProduct);

      await expect(productService.getProductById(mockEnv, 'prod-1', true)).rejects.toThrow(NotFoundError);
    });

    it('should check activeOnly against DB product', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      mockPrisma.product.findUnique.mockResolvedValue(inactiveProduct);

      await expect(productService.getProductById(mockEnv, 'prod-1', true)).rejects.toThrow(NotFoundError);
    });
  });
});
