import { getPrisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheDelete, cacheWrap, CacheKeys, CACHE_TTL } from '../lib/cache.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { Env } from '../types.js';

export const productService = {
  async listProducts(env: Env, params: { page: number; limit: number; search?: string; category?: string; activeOnly?: boolean }) {
    const { page, limit, search, category, activeOnly } = params;
    const skip = (page - 1) * limit;
    const cacheKey = CacheKeys.productsCatalog(page, limit) + (search ? `:s:${search}` : '') + (category ? `:c:${category}` : '');

    const cached = await cacheGet<any>(env.KV, cacheKey);
    if (cached) return cached;

    const prisma = getPrisma(env.DB);
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (activeOnly !== undefined) where.isActive = activeOnly;

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await cacheSet(env.KV, cacheKey, result, CACHE_TTL.PRODUCT_CATALOG);
    return result;
  },

  async searchProducts(env: Env, query: string, limit: number = 20) {
    const prisma = getPrisma(env.DB);
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getProductById(env: Env, id: string, activeOnly?: boolean) {
    const cacheKey = CacheKeys.product(id);
    const cached = await cacheGet<any>(env.KV, cacheKey);
    if (cached) {
      if (activeOnly !== undefined && cached.isActive !== activeOnly) {
        throw new NotFoundError(`Product with id ${id} not found`);
      }
      return cached;
    }

    const prisma = getPrisma(env.DB);
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) throw new NotFoundError(`Product with id ${id} not found`);
    if (activeOnly !== undefined && product.isActive !== activeOnly) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    await cacheSet(env.KV, cacheKey, product, CACHE_TTL.PRODUCT_CATALOG);
    return product;
  },
};
