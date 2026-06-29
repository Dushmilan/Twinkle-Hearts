// Admin services
// Private Commercial Project - Confidential

import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import prisma from '../lib/prisma.js';
import { cacheDelete, CacheKeys } from '../lib/cache.js';
import { uploadImages, deleteImages, extractPublicId, isCloudinaryUrl } from '../lib/cloudinary.js';
import { uploadProductImages as uploadMiddleware, handleUploadError } from '../middleware/upload.js';

// Admin Stats Service
export async function getDashboardStats(userId: string) {
  const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
    }),
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
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

// Admin Product Service
export async function createProduct(input: any, userId: string) {
  const { name, description, price, stock, sku, category, images, isActive = true } = input;

  const product = await prisma.product.create({
    data: { name, description, price, stock, sku, category, images, isActive },
  });

  await cacheDelete(CacheKeys.productsCatalog(1, 100));
  await cacheDelete(CacheKeys.productsFeatured());

  return product;
}

export async function updateProduct(id: string, input: any, userId: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: input,
  });

  await cacheDelete(CacheKeys.productsCatalog(1, 100));
  await cacheDelete(CacheKeys.productsFeatured());
  await cacheDelete(CacheKeys.product(id));

  return updatedProduct;
}

export async function deleteProduct(id: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const hasOrders = await prisma.orderItem.findFirst({
    where: { productId: id },
  });

  if (hasOrders) {
    throw new BadRequestError('Cannot delete product that has orders. Please deactivate instead.');
  }

  if (product.images && product.images.length > 0) {
    const publicIds = product.images
      .filter((url: string) => isCloudinaryUrl(url))
      .map((url: string) => extractPublicId(url))
      .filter((id: string | null): id is string => id !== null);

    if (publicIds.length > 0) {
      await deleteImages(publicIds);
    }
  }

  await cacheDelete(CacheKeys.productsCatalog(1, 100));
  await cacheDelete(CacheKeys.productsFeatured());
  await cacheDelete(CacheKeys.product(id));

  await prisma.product.delete({ where: { id } });

  return { id };
}

export async function uploadProductImages(input: Express.Multer.File[], userId: string) {
  const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!cloudinaryConfigured) {
    throw new BadRequestError(
      'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.'
    );
  }

  const files = input.map((file) => file.buffer);
  const results = await uploadImages(files, {
    folder: 'twinkle-hearts/products',
    tags: ['product', 'admin-upload'],
  });

  const urls = results.map((r) => r.secure_url);

  return { urls, count: urls.length };
}

// Admin User Service
export async function updateUserRole(id: string, role: string, requestingUserId: string) {
  if (!['CUSTOMER', 'ADMIN', 'VENDOR'].includes(role)) {
    throw new BadRequestError('Invalid role');
  }

  if (requestingUserId === id) {
    throw new BadRequestError('Cannot modify your own role');
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new BadRequestError('Cannot demote the last admin. At least one admin must remain.');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  await cacheDelete(CacheKeys.user(id));

  return updatedUser;
}

export async function getAllUsers(page: number, limit: number, search: string) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            wishlist: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}