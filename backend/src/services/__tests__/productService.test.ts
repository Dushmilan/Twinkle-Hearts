import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache/index.js');

import { getPrisma, getPrismaRepository } from '../../lib/prisma.js';
import { getCacheRepository } from '../../lib/cache/index.js';
import { productService } from '../productService.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

describe('productService', () => {
  let mockPrisma: any;
  let mockEnv: any;
  let mockCache: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getCacheRepository).mockReturnValue(mockCache as any);

    mockPrisma = {
      product: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    };

    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
    } as any;
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
      mockCache.get.mockResolvedValue(cached);

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

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should normalize images from JSON string to array', async () => {
      const dbProduct = { id: 'prod-1', name: 'P', description: 'd', price: 100, stock: 10, category: 'Cat', images: '["a.jpg","b.jpg"]', isActive: true, createdAt: new Date() };
      mockPrisma.product.findMany.mockResolvedValue([dbProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await productService.listProducts(mockEnv, { page: 1, limit: 20 });

      expect(result.products[0].images).toEqual(['a.jpg', 'b.jpg']);
      expect(Array.isArray(result.products[0].images)).toBe(true);
    });

    it('should normalize images from comma-joined string to array', async () => {
      const dbProduct = { id: 'prod-1', name: 'P', description: 'd', price: 100, stock: 10, category: 'Cat', images: '/x.jpg,/y.jpg', isActive: true, createdAt: new Date() };
      mockPrisma.product.findMany.mockResolvedValue([dbProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await productService.listProducts(mockEnv, { page: 1, limit: 20 });

      expect(result.products[0].images).toEqual(['/x.jpg', '/y.jpg']);
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
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return cached product', async () => {
      mockCache.get.mockResolvedValue(mockProduct);

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
      mockCache.get.mockResolvedValue(inactiveProduct);

      await expect(productService.getProductById(mockEnv, 'prod-1', true)).rejects.toThrow(NotFoundError);
    });

    it('should check activeOnly against DB product', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      mockPrisma.product.findUnique.mockResolvedValue(inactiveProduct);

      await expect(productService.getProductById(mockEnv, 'prod-1', true)).rejects.toThrow(NotFoundError);
    });

    it('should normalize images from JSON string to array', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, images: '["main.jpg","thumb.jpg"]' });

      const result = await productService.getProductById(mockEnv, 'prod-1');

      expect(Array.isArray(result.images)).toBe(true);
      expect(result.images).toEqual(['main.jpg', 'thumb.jpg']);
      expect(mockCache.set).toHaveBeenCalled();
      const setVal = mockCache.set.mock.calls[0]?.[1] as any;
      expect(setVal.images).toEqual(['main.jpg', 'thumb.jpg']);
    });

    it('should normalize images on cache hit (idempotent for arrays)', async () => {
      mockCache.get.mockResolvedValue({ ...mockProduct, images: ['already-array.jpg'] });

      const result = await productService.getProductById(mockEnv, 'prod-1');

      expect(Array.isArray(result.images)).toBe(true);
      expect(result.images).toEqual(['already-array.jpg']);
    });
  });
});
