import { getPrismaRepository } from '../lib/prisma.js';
import { CacheKeys, getCacheRepository } from '../lib/cache/index.js';
import { getPublicUrl } from '../lib/images.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { Env } from '../types.js';

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function normalizeImages(images: unknown): string[] {
  let arr: string[];
  if (Array.isArray(images)) arr = images.filter((i): i is string => typeof i === 'string');
  else if (typeof images !== 'string') return [];
  else {
    const trimmed = images.trim();
    if (!trimmed || trimmed === '[]') return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) arr = parsed.filter((i): i is string => typeof i === 'string');
        else arr = [];
      } catch {
        arr = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else {
      arr = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return arr.map((url) => isAbsoluteUrl(url) ? url : getPublicUrl(url));
}

function normalizeProduct<T extends { images: unknown }>(product: T): T {
  return { ...product, images: normalizeImages(product.images) as T['images'] };
}

export const productService = {
  async listProducts(env: Env, params: { page: number; limit: number; search?: string; category?: string; activeOnly?: boolean }) {
    const { page, limit, search, category, activeOnly } = params;
    const skip = (page - 1) * limit;
    const cacheKey = CacheKeys.productsCatalog(page, limit) + (search ? `:s:${search}` : '') + (category ? `:c:${category}` : '');
    const cache = getCacheRepository(env.KV);

    const cached = await cache.get(cacheKey) as { products: any[]; pagination: any } | null;
    if (cached) {
      return {
        ...cached,
        products: cached.products.map((p: any) => normalizeProduct(p)),
      };
    }

    const prisma = getPrismaRepository(env.DB);
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
      products: products.map((p) => normalizeProduct(p)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await cache.set(cacheKey, result);
    return result;
  },

  async searchProducts(env: Env, query: string, limit: number = 20) {
    const prisma = getPrismaRepository(env.DB);
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => normalizeProduct(p));
  },

  async getProductById(env: Env, id: string, activeOnly?: boolean) {
    const cacheKey = CacheKeys.product(id);
    const cache = getCacheRepository(env.KV);
    const cached = (await cache.get(cacheKey)) as any;
    if (cached) {
      const normalized = normalizeProduct(cached);
      if (activeOnly !== undefined && normalized.isActive !== activeOnly) {
        throw new NotFoundError(`Product with id ${id} not found`);
      }
      return normalized;
    }

    const prisma = getPrismaRepository(env.DB);
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) throw new NotFoundError(`Product with id ${id} not found`);
    if (activeOnly !== undefined && product.isActive !== activeOnly) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }

    const normalized = normalizeProduct(product);
    await cache.set(cacheKey, normalized);
    return normalized;
  },
};