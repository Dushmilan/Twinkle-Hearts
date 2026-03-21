// Cache service with Redis and in-memory fallback
// Private Commercial Project - Confidential

import { redis } from './redis.js';
import { logger } from './logger.js';

// In-memory cache fallback (when Redis is unavailable)
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Cache TTL defaults (in seconds)
export const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60,      // 7 days
  USER_PROFILE: 60 * 60,           // 1 hour
  USER_ORDERS: 10 * 60,            // 10 minutes
  USER_WISHLIST: 30 * 60,          // 30 minutes
  PRODUCT_CATALOG: 30 * 60,        // 30 minutes
  FEATURED_PRODUCTS: 60 * 60,      // 1 hour
  ADMIN_STATS: 5 * 60,             // 5 minutes
  OTP: 5 * 60,                     // 5 minutes
  RATE_LIMIT: 15 * 60,             // 15 minutes
} as const;

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value as T;
    }
    
    // Clean expired memory cache entry
    if (cached) {
      memoryCache.delete(key);
    }
    
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = CACHE_TTL.USER_PROFILE
): Promise<void> {
  try {
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
      });
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    if (redis) {
      const exists = await redis.exists(key);
      return exists === 1;
    } else {
      const cached = memoryCache.get(key);
      return cached !== undefined && cached.expiry > Date.now();
    }
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
}

/**
 * Cache wrapper for async functions
 * Automatically caches result and handles cache misses
 */
export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.USER_PROFILE
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - execute function
  const result = await fn();
  
  // Store in cache
  await cacheSet(key, result, ttlSeconds);
  
  return result;
}

/**
 * Clear all cache (use with caution)
 */
export async function cacheClear(): Promise<void> {
  try {
    if (redis) {
      await redis.flushdb();
    } else {
      memoryCache.clear();
    }
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
}

/**
 * Get cache stats
 */
export async function cacheStats(): Promise<{
  type: 'redis' | 'memory';
  keys?: number;
  used_memory?: string;
  memoryCacheSize: number;
}> {
  try {
    if (redis) {
      const info = await redis.info('memory');
      const keys = await redis.dbsize();
      
      return {
        type: 'redis',
        keys,
        used_memory: info.match(/used_memory_human:(.+)/)?.[1]?.trim() || 'N/A',
        memoryCacheSize: memoryCache.size,
      };
    }
    
    return {
      type: 'memory',
      memoryCacheSize: memoryCache.size,
    };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return {
      type: 'error',
      memoryCacheSize: memoryCache.size,
    } as any;
  }
}

// Cache key helpers
export const CacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  userOrders: (userId: string) => `user:orders:${userId}`,
  userWishlist: (userId: string) => `user:wishlist:${userId}`,
  userAddresses: (userId: string) => `user:addresses:${userId}`,
  product: (productId: string) => `product:${productId}`,
  productsCatalog: (page: number, limit: number) => `products:catalog:${page}:${limit}`,
  productsFeatured: () => 'products:featured',
  adminStats: () => 'admin:stats',
  otp: (phone: string) => `otp:${phone}`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
};
