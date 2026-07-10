const CACHE_PREFIX = 'twinkle-hearts:';

export const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60,
  USER_PROFILE: 60 * 60,
  USER_ORDERS: 10 * 60,
  USER_WISHLIST: 30 * 60,
  PRODUCT_CATALOG: 30 * 60,
  FEATURED_PRODUCTS: 60 * 60,
  ADMIN_STATS: 5 * 60,
  OTP: 5 * 60,
  RATE_LIMIT: 15 * 60,
} as const;

export async function cacheGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    const value = await kv.get(`${CACHE_PREFIX}${key}`, 'text');
    if (value) return JSON.parse(value) as T;
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  kv: KVNamespace,
  key: string,
  value: any,
  ttlSeconds: number = CACHE_TTL.USER_PROFILE
): Promise<void> {
  try {
    await kv.put(`${CACHE_PREFIX}${key}`, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    console.error('Cache set error');
  }
}

export async function cacheDelete(kv: KVNamespace, key: string): Promise<void> {
  try {
    await kv.delete(`${CACHE_PREFIX}${key}`);
  } catch {
    console.error('Cache delete error');
  }
}

export async function cacheWrap<T>(
  kv: KVNamespace,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.USER_PROFILE
): Promise<T> {
  const cached = await cacheGet<T>(kv, key);
  if (cached !== null) return cached;
  const result = await fn();
  await cacheSet(kv, key, result, ttlSeconds);
  return result;
}

export const CacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  userOrders: (userId: string) => `user:orders:${userId}`,
  userWishlist: (userId: string) => `user:wishlist:${userId}`,
  userAddresses: (userId: string) => `user:addresses:${userId}`,
  product: (productId: string) => `product:${productId}`,
  productsCatalog: (page: number, limit: number) => `products:catalog:${page}:${limit}`,
  productsCatalogPrefix: () => 'products:catalog:',
  productsFeatured: () => 'products:featured',
  adminStats: () => 'admin:stats',
  otp: (phone: string) => `otp:${phone}`,
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,
};
