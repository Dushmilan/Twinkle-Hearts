import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache.js');
vi.mock('../../lib/images.js');

import { getPrisma } from '../../lib/prisma.js';
import * as cacheLib from '../../lib/cache.js';
import * as imageLib from '../../lib/images.js';
import {
  getDashboardStats, createProduct, updateProduct, deleteProduct,
  uploadProductImages, updateUserRole, getAllUsers,
} from '../adminService.js';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';

describe('adminService', () => {
  let mockPrisma: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      order: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
      user: { count: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
      product: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
      orderItem: { findFirst: vi.fn() },
    };

    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
      R2: {} as any,
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    } as any;

    vi.mocked(cacheLib.cacheDelete).mockResolvedValue(undefined);
  });

  describe('getDashboardStats', () => {
    it('should return aggregated dashboard stats', async () => {
      mockPrisma.order.count.mockResolvedValue(42);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 50000 } });
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.product.count.mockResolvedValue(100);
      mockPrisma.order.findMany.mockResolvedValue([{ id: 'order-1', total: 1000, user: { name: 'Test', email: 'test@example.com' }, createdAt: new Date() }]);

      const stats = await getDashboardStats(mockEnv);

      expect(stats.totalOrders).toBe(42);
      expect(stats.totalRevenue).toBe(50000);
      expect(stats.totalUsers).toBe(10);
      expect(stats.totalProducts).toBe(100);
      expect(stats.recentOrders).toHaveLength(1);
    });
  });

  describe('createProduct', () => {
    const productInput = { name: 'New Product', description: 'A great product description', price: 2999, stock: 10, sku: 'SKU-001', category: 'Electronics', images: JSON.stringify(['https://example.com/img.jpg']), isActive: true };

    it('should create a product', async () => {
      mockPrisma.product.create.mockResolvedValue({ id: 'prod-1', ...productInput });

      const result = await createProduct(mockEnv, productInput);

      expect(result.id).toBe('prod-1');
      expect(cacheLib.cacheDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateProduct', () => {
    it('should update existing product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Old Name' });
      mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', name: 'Updated Name' });

      const result = await updateProduct(mockEnv, 'prod-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(cacheLib.cacheDelete).toHaveBeenCalledTimes(3);
    });

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(updateProduct(mockEnv, 'unknown', { name: 'Test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product without images', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', images: '[]' });
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);
      mockPrisma.product.delete.mockResolvedValue({ id: 'prod-1' });

      const result = await deleteProduct(mockEnv, 'prod-1');
      expect(result.id).toBe('prod-1');
    });

    it('should throw if product has orders', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'order-item-1' });

      await expect(deleteProduct(mockEnv, 'prod-1')).rejects.toThrow(BadRequestError);
      await expect(deleteProduct(mockEnv, 'prod-1')).rejects.toThrow('Cannot delete product that has orders');
    });

    it('should throw if not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(deleteProduct(mockEnv, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2', role: 'CUSTOMER' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-2', name: 'Test', email: 'test@example.com', role: 'ADMIN' });

      const result = await updateUserRole(mockEnv, 'user-2', 'ADMIN', 'admin-1');
      expect(result.role).toBe('ADMIN');
    });

    it('should not allow modifying own role', async () => {
      await expect(updateUserRole(mockEnv, 'admin-1', 'CUSTOMER', 'admin-1')).rejects.toThrow(BadRequestError);
    });

    it('should not allow invalid role', async () => {
      await expect(updateUserRole(mockEnv, 'user-2', 'INVALID', 'admin-1')).rejects.toThrow(BadRequestError);
    });

    it('should not demote the last admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(updateUserRole(mockEnv, 'admin-1', 'CUSTOMER', 'other-admin')).rejects.toThrow(BadRequestError);
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(updateUserRole(mockEnv, 'unknown', 'ADMIN', 'admin-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1', name: 'Test', email: 'test@example.com', phone: '+919876543210', role: 'CUSTOMER', createdAt: new Date(), updatedAt: new Date(), _count: { orders: 0, addresses: 1, wishlist: 0 } }]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await getAllUsers(mockEnv, 1, 20, '');

      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should search users by name or email', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await getAllUsers(mockEnv, 1, 20, 'test');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test' } },
              { email: { contains: 'test' } },
            ],
          },
        })
      );
    });
  });

  describe('uploadProductImages', () => {
    it('should use Cloudinary when configured', async () => {
      mockEnv.CLOUDINARY_CLOUD_NAME = 'cloud';
      mockEnv.CLOUDINARY_API_KEY = 'key';
      mockEnv.CLOUDINARY_API_SECRET = 'secret';
      vi.mocked(imageLib.uploadToCloudinary).mockResolvedValue({ secure_url: 'https://cloudinary.com/img.jpg' } as any);

      const mockFile = { name: 'test.jpg', type: 'image/jpeg', size: 1000, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) };

      const result = await uploadProductImages(mockEnv, [mockFile as any]);

      expect(result.urls).toHaveLength(1);
      expect(imageLib.uploadToCloudinary).toHaveBeenCalled();
    });

    it('should fallback to R2 when Cloudinary not configured', async () => {
      vi.mocked(imageLib.uploadToR2).mockResolvedValue('r2-key');

      const mockFile = { name: 'test.jpg', type: 'image/jpeg', size: 1000, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) };

      const result = await uploadProductImages(mockEnv, [mockFile as any]);

      expect(result.urls).toHaveLength(1);
      expect(imageLib.uploadToR2).toHaveBeenCalled();
    });
  });
});
