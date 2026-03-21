// User service
// Private Commercial Project - Confidential

import prisma from '../lib/prisma.js';
import { cacheDelete, cacheGet, cacheSet, CACHE_TTL, CacheKeys } from '../lib/cache.js';
import { logger } from '../lib/logger.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/errorHandler.js';
import { hashPassword, comparePassword } from '../utils/password.js';

/**
 * Get user profile (exported from authService)
 */
export async function getUserProfile(userId: string) {
  const cached = await cacheGet(CacheKeys.user(userId));
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
          wishlist: true,
        },
      },
    },
  });

  if (user) {
    await cacheSet(CacheKeys.user(userId), user, CACHE_TTL.USER_PROFILE);
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string; avatar?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  await cacheDelete(CacheKeys.user(userId));

  return user;
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new BadRequestError('Cannot change password for OAuth accounts');
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId },
  });

  await cacheDelete(CacheKeys.user(userId));

  logger.info(`Password changed for user: ${userId}`);
}

/**
 * Get user's orders with caching
 */
export async function getUserOrders(userId: string, page: number = 1, limit: number = 20) {
  const cacheKey = CacheKeys.userOrders(userId);
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            price: true,
          },
        },
      },
      select: {
        id: true,
        status: true,
        total: true,
        items: true,
        createdAt: true,
        confirmedAt: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const result = {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await cacheSet(cacheKey, result, CACHE_TTL.USER_ORDERS);

  return result;
}

/**
 * Get user's addresses with caching
 */
export async function getUserAddresses(userId: string) {
  const cacheKey = CacheKeys.userAddresses(userId);
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  await cacheSet(cacheKey, addresses, CACHE_TTL.USER_PROFILE);

  return addresses;
}

/**
 * Create new address
 */
export async function createAddress(
  userId: string,
  data: {
    label: string;
    type?: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    isDefault?: boolean;
  }
) {
  // If this is default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      ...data,
    },
  });

  await cacheDelete(CacheKeys.userAddresses(userId));

  return address;
}

/**
 * Update address
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  data: {
    label?: string;
    type?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  }
) {
  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Address not found');
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  await cacheDelete(CacheKeys.userAddresses(userId));

  return address;
}

/**
 * Delete address
 */
export async function deleteAddress(userId: string, addressId: string) {
  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new NotFoundError('Address not found');
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  await cacheDelete(CacheKeys.userAddresses(userId));
}

/**
 * Get user's wishlist with caching
 */
export async function getUserWishlist(userId: string) {
  const cacheKey = CacheKeys.userWishlist(userId);
  
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          stock: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = wishlist.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
    },
  }));

  await cacheSet(cacheKey, result, CACHE_TTL.USER_WISHLIST);

  return result;
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(userId: string, productId: string) {
  // Check if product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found or inactive');
  }

  // Check if already in wishlist
  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    throw new BadRequestError('Product already in wishlist');
  }

  const wishlist = await prisma.wishlist.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          stock: true,
        },
      },
    },
  });

  await cacheDelete(CacheKeys.userWishlist(userId));

  return {
    ...wishlist,
    product: {
      ...wishlist.product,
      price: Number(wishlist.product.price),
    },
  };
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlist.delete({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  }).catch(() => {
    throw new NotFoundError('Product not in wishlist');
  });

  await cacheDelete(CacheKeys.userWishlist(userId));
}
