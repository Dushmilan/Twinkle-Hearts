import { getPrisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheDelete, CACHE_TTL, CacheKeys } from '../lib/cache.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import type { Env } from '../types.js';

export async function getUserProfile(env: Env, userId: string) {
  const cached = await cacheGet(env.KV, CacheKeys.user(userId));
  if (cached) return cached;

  const prisma = getPrisma(env.DB);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true, phone: true, avatar: true, role: true,
      emailVerified: true, createdAt: true, lastLoginAt: true,
      _count: { select: { orders: true, addresses: true, wishlist: true } },
    },
  });

  if (user) {
    await cacheSet(env.KV, CacheKeys.user(userId), user, CACHE_TTL.USER_PROFILE);
  }

  return user;
}

export async function updateUserProfile(env: Env, userId: string, data: { name?: string; phone?: string; avatar?: string }) {
  const prisma = getPrisma(env.DB);
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, phone: true, avatar: true, role: true },
  });

  await cacheDelete(env.KV, CacheKeys.user(userId));
  return user;
}

export async function changePassword(env: Env, userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const prisma = getPrisma(env.DB);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw new BadRequestError('Cannot change password for OAuth accounts');
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  await prisma.session.deleteMany({ where: { userId } });
  await cacheDelete(env.KV, CacheKeys.user(userId));

  console.info(`Password changed for user: ${userId}`);
}

export async function getUserAddresses(env: Env, userId: string) {
  const cacheKey = CacheKeys.userAddresses(userId);
  const cached = await cacheGet(env.KV, cacheKey);
  if (cached) return cached;

  const prisma = getPrisma(env.DB);
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  await cacheSet(env.KV, cacheKey, addresses, CACHE_TTL.USER_PROFILE);
  return addresses;
}

export async function createAddress(env: Env, userId: string, data: {
  label: string; type?: string; street: string; city: string; state: string;
  zip: string; country: string; phone: string; isDefault?: boolean;
}) {
  const prisma = getPrisma(env.DB);

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      userId, label: data.label, type: data.type as any, street: data.street, city: data.city,
      state: data.state, zip: data.zip, country: data.country, phone: data.phone, isDefault: data.isDefault,
    },
  });

  await cacheDelete(env.KV, CacheKeys.userAddresses(userId));
  return address;
}

export async function updateAddress(env: Env, userId: string, addressId: string, data: any) {
  const prisma = getPrisma(env.DB);
  const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });

  if (!existing) throw new NotFoundError('Address not found');

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({ where: { id: addressId }, data });
  await cacheDelete(env.KV, CacheKeys.userAddresses(userId));
  return address;
}

export async function deleteAddress(env: Env, userId: string, addressId: string) {
  const prisma = getPrisma(env.DB);
  const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });

  if (!existing) throw new NotFoundError('Address not found');

  await prisma.address.delete({ where: { id: addressId } });
  await cacheDelete(env.KV, CacheKeys.userAddresses(userId));
}

export async function getUserWishlist(env: Env, userId: string) {
  const cacheKey = CacheKeys.userWishlist(userId);
  const cached = await cacheGet(env.KV, cacheKey);
  if (cached) return cached;

  const prisma = getPrisma(env.DB);
  const wishlist = await prisma.wishlist.findMany({
    where: { userId },
    include: { product: { select: { id: true, name: true, price: true, images: true, stock: true, isActive: true } } },
    orderBy: { createdAt: 'desc' },
  });

  await cacheSet(env.KV, cacheKey, wishlist, CACHE_TTL.USER_WISHLIST);
  return wishlist;
}

export async function addToWishlist(env: Env, userId: string, productId: string) {
  const prisma = getPrisma(env.DB);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });

  if (!product || !product.isActive) throw new NotFoundError('Product not found or inactive');

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) throw new BadRequestError('Product already in wishlist');

  const wishlist = await prisma.wishlist.create({
    data: { userId, productId },
    include: { product: { select: { id: true, name: true, price: true, images: true, stock: true } } },
  });

  await cacheDelete(env.KV, CacheKeys.userWishlist(userId));
  return wishlist;
}

export async function removeFromWishlist(env: Env, userId: string, productId: string) {
  const prisma = getPrisma(env.DB);
  await prisma.wishlist.delete({
    where: { userId_productId: { userId, productId } },
  }).catch(() => { throw new NotFoundError('Product not in wishlist'); });

  await cacheDelete(env.KV, CacheKeys.userWishlist(userId));
}
