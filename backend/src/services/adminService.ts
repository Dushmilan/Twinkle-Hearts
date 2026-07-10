import { getPrismaRepository } from '../lib/prisma.js';
import { CacheKeys, getCacheRepository } from '../lib/cache/index.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { uploadToR2, deleteMultipleFromR2, uploadToCloudinary, extractR2Key, isR2Url } from '../lib/images.js';
import type { Env } from '../types.js';

export async function getDashboardStats(env: Env) {
  const prisma = getPrismaRepository(env.DB);

  const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalUsers,
    totalProducts,
    recentOrders,
  };
}

export async function createProduct(env: Env, input: any) {
  const prisma = getPrismaRepository(env.DB);
  const { name, description, price, stock, category, images, isActive = true } = input;

  const product = await prisma.product.create({
    data: { name, description, price, stock, category, images, isActive, sku: '' },
  });

  const cache = getCacheRepository(env.KV);
  await cache.deleteByPrefix(CacheKeys.productsCatalogPrefix());
  await cache.delete(CacheKeys.productsFeatured());

  return product;
}

export async function updateProduct(env: Env, id: string, input: any) {
  const prisma = getPrismaRepository(env.DB);
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) throw new NotFoundError('Product not found');

  const updatedProduct = await prisma.product.update({ where: { id }, data: input });

  const cache = getCacheRepository(env.KV);
  await cache.deleteByPrefix(CacheKeys.productsCatalogPrefix());
  await cache.delete(CacheKeys.productsFeatured());
  await cache.delete( CacheKeys.product(id));

  return updatedProduct;
}

export async function deleteProduct(env: Env, id: string) {
  const prisma = getPrismaRepository(env.DB);
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) throw new NotFoundError('Product not found');

  const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });

  if (hasOrders) {
    throw new BadRequestError('Cannot delete product that has orders. Please deactivate instead.');
  }

  const images: string[] = JSON.parse(product.images || '[]');
  if (images.length > 0) {
    const r2Keys = images
      .filter((url: string) => isR2Url(url))
      .map((url: string) => extractR2Key(url))
      .filter((k: string | null): k is string => k !== null);

    if (r2Keys.length > 0) {
      await deleteMultipleFromR2(env.R2, r2Keys);
    }
  }

  const cache = getCacheRepository(env.KV);
  await cache.deleteByPrefix(CacheKeys.productsCatalogPrefix());
  await cache.delete(CacheKeys.productsFeatured());
  await cache.delete( CacheKeys.product(id));

  await prisma.product.delete({ where: { id } });
  return { id };
}

export async function uploadProductImages(env: Env, files: Array<{ name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }>) {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    const urls: string[] = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const result = await uploadToCloudinary(
        env.CLOUDINARY_CLOUD_NAME,
        env.CLOUDINARY_API_KEY,
        env.CLOUDINARY_API_SECRET,
        buffer,
        'twinkle-hearts/products'
      );
      urls.push(result.secure_url);
    }
    return { urls, count: urls.length };
  }

  const urls: string[] = [];
  for (const file of files) {
    const key = await uploadToR2(env.R2, file);
    urls.push(key);
  }

  return { urls, count: urls.length };
}

export async function updateUserRole(env: Env, id: string, role: string, requestingUserId: string) {
  if (!['CUSTOMER', 'ADMIN', 'VENDOR'].includes(role)) {
    throw new BadRequestError('Invalid role');
  }

  if (requestingUserId === id) {
    throw new BadRequestError('Cannot modify your own role');
  }

  const prisma = getPrismaRepository(env.DB);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw new NotFoundError('User not found');

  if (user.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new BadRequestError('Cannot demote the last admin. At least one admin must remain.');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  await getCacheRepository(env.KV).delete( CacheKeys.user(id));
  return updatedUser;
}

export async function getAllUsers(env: Env, page: number, limit: number, search: string) {
  const prisma = getPrismaRepository(env.DB);
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true,
        _count: { select: { orders: true, addresses: true, wishlist: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
