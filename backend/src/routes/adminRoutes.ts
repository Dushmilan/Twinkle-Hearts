// Admin routes
// Private Commercial Project - Confidential

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import { cacheDelete, CacheKeys } from '../lib/cache.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import {
uploadProductImages,
handleUploadError,
} from '../middleware/upload.js';
import { uploadImages, deleteImage, extractPublicId, isCloudinaryUrl } from '../lib/cloudinary.js';

const router = Router();

// Validation schemas
const productSchema = z.object({
name: z.string().min(2, 'Name must be at least 2 characters'),
description: z.string().min(10, 'Description must be at least 10 characters'),
price: z.number().int().positive('Price must be positive'),
stock: z.number().int().nonnegative('Stock cannot be negative'),
sku: z.string().min(1, 'SKU is required'),
category: z.string().min(1, 'Category is required'),
images: z.array(z.string()).min(1, 'At least one product image is required'),
isActive: z.boolean().optional().default(true),
});

const updateProductSchema = productSchema.partial();

/**
* POST /api/admin/products/upload
* Upload product images to Cloudinary
* Uses signed uploads for security
*/
router.post(
'/products/upload',
authenticate,
requireAdmin,
uploadProductImages('images', 10),
handleUploadError,
async (req: Request, res: Response, next: NextFunction) => {
try {
if (!req.files || req.files.length === 0) {
throw new BadRequestError('No files uploaded');
}

// Cloudinary is required for production image uploads
const cloudinaryConfigured =
process.env.CLOUDINARY_CLOUD_NAME &&
process.env.CLOUDINARY_API_KEY &&
process.env.CLOUDINARY_API_SECRET;

if (!cloudinaryConfigured) {
throw new BadRequestError(
'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.'
);
}

// Upload to Cloudinary
const files = (req.files as Express.Multer.File[]).map((file) => file.buffer);
const results = await uploadImages(files, {
folder: 'twinkle-hearts/products',
tags: ['product', 'admin-upload'],
});

const urls = results.map((r) => r.secure_url);

res.json({
success: true,
data: {
urls,
count: urls.length,
},
});
} catch (error) {
next(error);
}
}
);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders] =
      await Promise.all([
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

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalUsers,
        totalProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 * Get all orders with pagination
 */
router.get('/orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/products
 * Get all products with pagination
 */
router.get('/products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/products
 * Create a new product
 */
router.post('/products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const input = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: input,
    });

    // Invalidate cache
    await cacheDelete(CacheKeys.productsCatalog(1, 100));
    await cacheDelete(CacheKeys.productsFeatured());

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put('/products/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const input = updateProductSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: input,
    });

    // Invalidate cache
    await cacheDelete(CacheKeys.productsCatalog(1, 100));
    await cacheDelete(CacheKeys.productsFeatured());
    await cacheDelete(CacheKeys.product(id));

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
router.delete('/products/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // C6: Check if product has orders before deletion
    const hasOrders = await prisma.orderItem.findFirst({
      where: { productId: id },
    });

    if (hasOrders) {
      throw new BadRequestError('Cannot delete product that has orders. Please deactivate instead.');
    }

    // Delete images from Cloudinary if they are Cloudinary URLs
    if (product.images && product.images.length > 0) {
      const { deleteImages, extractPublicId, isCloudinaryUrl } = await import('../lib/cloudinary.js');

      const publicIds = product.images
        .filter((url) => isCloudinaryUrl(url))
        .map((url) => extractPublicId(url))
        .filter((id): id is string => id !== null);

      if (publicIds.length > 0) {
        await deleteImages(publicIds);
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    // Invalidate cache
    await cacheDelete(CacheKeys.productsCatalog(1, 100));
    await cacheDelete(CacheKeys.productsFeatured());
    await cacheDelete(CacheKeys.product(id));

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where: Prisma.UserWhereInput = {};

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

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN', 'VENDOR'].includes(role)) {
      throw new BadRequestError('Invalid role');
    }

    // H1: Prevent admin from modifying their own role
    if (req.user!.id === id) {
      throw new BadRequestError('Cannot modify your own role');
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // H2: Prevent demoting the last admin
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

    // Invalidate cache
    await cacheDelete(CacheKeys.user(id));

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
