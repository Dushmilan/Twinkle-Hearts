import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../lib/cache.js');
vi.mock('../../utils/password.js');

import { getPrisma } from '../../lib/prisma.js';
import * as cacheLib from '../../lib/cache.js';
import * as passwordUtils from '../../utils/password.js';
import {
  getUserProfile, updateUserProfile, changePassword,
  getUserAddresses, createAddress, updateAddress, deleteAddress,
  getUserWishlist, addToWishlist, removeFromWishlist,
} from '../userService.js';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';

describe('userService', () => {
  let mockPrisma: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: { findUnique: vi.fn(), update: vi.fn() },
      address: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), updateMany: vi.fn() },
      wishlist: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
      session: { deleteMany: vi.fn() },
      product: { findUnique: vi.fn() },
    };

    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
    } as any;

    vi.mocked(cacheLib.cacheGet).mockResolvedValue(null);
    vi.mocked(cacheLib.cacheSet).mockResolvedValue(undefined);
    vi.mocked(cacheLib.cacheDelete).mockResolvedValue(undefined);
  });

  describe('getUserProfile', () => {
    const mockProfile = { id: 'user-1', email: 'test@example.com', name: 'Test', phone: '+919876543210', avatar: null, role: 'CUSTOMER', emailVerified: true, createdAt: new Date(), lastLoginAt: null, _count: { orders: 3, addresses: 2, wishlist: 5 } };

    it('should return user profile from cache if available', async () => {
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(mockProfile);

      const result = await getUserProfile(mockEnv, 'user-1');

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const result = await getUserProfile(mockEnv, 'user-1');

      expect(result).toEqual(mockProfile);
      expect(cacheLib.cacheSet).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getUserProfile(mockEnv, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user and invalidate cache', async () => {
      const updateData = { name: 'Updated Name', phone: '+919876543211' };
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', ...updateData });

      const result = await updateUserProfile(mockEnv, 'user-1', updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
        select: expect.any(Object),
      });
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'old-hash' });
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('new-hash');

      await changePassword(mockEnv, 'user-1', 'current-pass', 'new-pass');

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('new-pass');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hash' },
      });
    });

    it('should throw for OAuth accounts without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: null });

      await expect(changePassword(mockEnv, 'user-1', 'current', 'new')).rejects.toThrow(BadRequestError);
    });

    it('should throw if current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'hash' });
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(false);

      await expect(changePassword(mockEnv, 'user-1', 'wrong', 'new')).rejects.toThrow(BadRequestError);
    });
  });

  describe('getUserAddresses', () => {
    const mockAddresses = [{ id: 'addr-1', label: 'Home', street: '123 Main St', city: 'Colombo', isDefault: true }];

    it('should return cached addresses', async () => {
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(mockAddresses);

      const result = await getUserAddresses(mockEnv, 'user-1');

      expect(result).toEqual(mockAddresses);
      expect(mockPrisma.address.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache', async () => {
      mockPrisma.address.findMany.mockResolvedValue(mockAddresses);

      const result = await getUserAddresses(mockEnv, 'user-1');

      expect(result).toEqual(mockAddresses);
      expect(cacheLib.cacheSet).toHaveBeenCalled();
    });
  });

  describe('createAddress', () => {
    const addressInput = { label: 'Home', street: '123 Main St', city: 'Colombo', state: 'Western', zip: '00100', country: 'LK', phone: '+949876543210', isDefault: true };

    it('should create address and clear cache', async () => {
      mockPrisma.address.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.address.create.mockResolvedValue({ id: 'addr-1', ...addressInput });

      const result = await createAddress(mockEnv, 'user-1', addressInput);

      expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });
  });

  describe('updateAddress', () => {
    it('should update address', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
      mockPrisma.address.update.mockResolvedValue({ id: 'addr-1', label: 'Work' });

      const result = await updateAddress(mockEnv, 'user-1', 'addr-1', { label: 'Work' });

      expect(result.label).toBe('Work');
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });

    it('should throw if address not found', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(null);

      await expect(updateAddress(mockEnv, 'user-1', 'unknown', { label: 'Test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address', async () => {
      mockPrisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
      mockPrisma.address.delete.mockResolvedValue({ id: 'addr-1' });

      await deleteAddress(mockEnv, 'user-1', 'addr-1');

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
    });

    it('should throw if not found', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(null);

      await expect(deleteAddress(mockEnv, 'user-1', 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserWishlist', () => {
    it('should return cached wishlist', async () => {
      const mockWishlist = [{ id: 'wish-1', productId: 'prod-1', product: { id: 'prod-1', name: 'Test Product', price: 100, images: [], stock: 10 } }];
      vi.mocked(cacheLib.cacheGet).mockResolvedValue(mockWishlist);

      const result = await getUserWishlist(mockEnv, 'user-1');

      expect(result).toEqual(mockWishlist);
      expect(mockPrisma.wishlist.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache wishlist from DB', async () => {
      mockPrisma.wishlist.findMany.mockResolvedValue([]);

      const result = await getUserWishlist(mockEnv, 'user-1');

      expect(result).toEqual([]);
      expect(cacheLib.cacheSet).toHaveBeenCalled();
    });
  });

  describe('addToWishlist', () => {
    it('should add product to wishlist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', isActive: true });
      mockPrisma.wishlist.findUnique.mockResolvedValue(null);
      mockPrisma.wishlist.create.mockResolvedValue({ id: 'wish-1', userId: 'user-1', productId: 'prod-1', product: { id: 'prod-1', name: 'Test', price: 100, images: [], stock: 5 } });

      const result = await addToWishlist(mockEnv, 'user-1', 'prod-1');

      expect(result.productId).toBe('prod-1');
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });

    it('should throw if product is inactive', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', isActive: false });

      await expect(addToWishlist(mockEnv, 'user-1', 'prod-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw if product already in wishlist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', isActive: true });
      mockPrisma.wishlist.findUnique.mockResolvedValue({ id: 'wish-1', userId: 'user-1', productId: 'prod-1' });

      await expect(addToWishlist(mockEnv, 'user-1', 'prod-1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist', async () => {
      mockPrisma.wishlist.delete.mockResolvedValue({ id: 'wish-1' });

      await removeFromWishlist(mockEnv, 'user-1', 'prod-1');

      expect(mockPrisma.wishlist.delete).toHaveBeenCalledWith({
        where: { userId_productId: { userId: 'user-1', productId: 'prod-1' } },
      });
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });

    it('should throw if not in wishlist', async () => {
      mockPrisma.wishlist.delete.mockRejectedValue(new Error('Not found'));

      await expect(removeFromWishlist(mockEnv, 'user-1', 'unknown')).rejects.toThrow(NotFoundError);
    });
  });
});
