import { Router } from 'express';
import prisma from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/products
 * List all active products with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Case-insensitive category matching
      where.category = { contains: category, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          sku: true,
          images: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Convert BigInt to number for JSON serialization
    const productsJson = products.map((p: any) => ({
      ...p,
      price: Number(p.price),
    }));

    res.json({
      products: productsJson,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/search
 * Search products
 * Note: This route must be defined BEFORE /:id to avoid conflicts
 */
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q as string;

    if (!q || q.length < 2) {
      res.json({ products: [], pagination: { total: 0 } });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
      },
    });

    res.json({
      products: products.map((p: any) => ({
        ...p,
        price: Number(p.price),
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        sku: true,
        images: true,
        category: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    res.json({
      product: {
        ...product,
        price: Number(product.price),
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
