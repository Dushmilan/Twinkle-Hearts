import { Prisma } from '@prisma/client';
import { cacheGet, cacheSet, cacheDelete, CacheKeys } from '../lib/cache.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import prisma from '../lib/prisma.js';
import { CACHE_TTL } from '../lib/cache.js';

interface ListProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  activeOnly?: boolean;
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  images: string[];
  isActive?: boolean;
}

interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  category?: string;
  images?: string[];
  isActive?: boolean;
}

export const productService = {
  async listProducts(params: ListProductsParams) {
    const { page, limit, search, category, activeOnly } = params;
    const skip = (page - 1) * limit;

    const cacheKey = CacheKeys.productsCatalog(page, limit) + (search ? `:s:${search}` : '') + (category ? `:c:${category}` : '');

    const cached = await cacheGet<{ products: any[]; pagination: any }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheSet(cacheKey, result, CACHE_TTL.PRODUCT_CATALOG);

    return result;
  },

  async searchProducts(query: string, limit: number) {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return products;
  },

  async getProductById(id: string, activeOnly?: boolean) {
    const cacheKey = CacheKeys.product(id);

    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      if (activeOnly !== undefined && cached.isActive !== activeOnly) {
        throw new NotFoundError(`Product with id ${id} not found`);
      }
      return cached;
    }

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    if (activeOnly !== undefined && product.isActive !== activeOnly) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    await cacheSet(cacheKey, product, CACHE_TTL.PRODUCT_CATALOG);

    return product;
  },

  async createProduct(data: CreateProductData) {
    const product = await prisma.product.create({ data });

    await cacheDelete(CacheKeys.productsCatalog(0, 0));

    return product;
  },

  async updateProduct(id: string, data: UpdateProductData) {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    await cacheDelete(CacheKeys.product(id));
    await cacheDelete(CacheKeys.productsCatalog(0, 0));

    return product;
  },

  async deleteProduct(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await cacheDelete(CacheKeys.product(id));
    await cacheDelete(CacheKeys.productsCatalog(0, 0));

    return product;
  },
};
