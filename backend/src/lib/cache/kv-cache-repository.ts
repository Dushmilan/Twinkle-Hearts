import type { CacheRepository, SessionData } from './cache-repository.js';
import { CacheKeys, CACHE_TTL } from '../cache.js';

const CACHE_PREFIX = 'twinkle-hearts:';

export class KVCacheRepository implements CacheRepository {
  constructor(private kv: KVNamespace) {}

  private fullKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(this.fullKey(key), 'text');
      if (value) return JSON.parse(value) as T;
      return null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      await this.kv.put(this.fullKey(key), JSON.stringify(value), {
        expirationTtl: ttlSeconds ?? CACHE_TTL.USER_PROFILE,
      });
    } catch {
      console.error('Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(this.fullKey(key));
    } catch {
      console.error('Cache delete error');
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const fullPrefix = this.fullKey(prefix);
      let cursor: string | undefined;
      do {
        const list = await this.kv.list({ prefix: fullPrefix, cursor });
        for (const key of list.keys) {
          await this.kv.delete(key.name);
        }
        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);
    } catch {
      console.error('Cache deleteByPrefix error');
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.get(CacheKeys.session(sessionId));
  }

  async setSession(sessionId: string, data: SessionData, ttl?: number): Promise<void> {
    return this.set(CacheKeys.session(sessionId), data, ttl ?? CACHE_TTL.SESSION);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    return this.delete(CacheKeys.session(sessionId));
  }

  async getUserOrders(userId: string): Promise<any | null> {
    return this.get(CacheKeys.userOrders(userId));
  }

  async setUserOrders(userId: string, data: any, ttl?: number): Promise<void> {
    return this.set(CacheKeys.userOrders(userId), data, ttl ?? CACHE_TTL.USER_ORDERS);
  }

  async invalidateUserOrders(userId: string): Promise<void> {
    return this.delete(CacheKeys.userOrders(userId));
  }

  async getProductCatalog(key: string): Promise<any | null> {
    return this.get(key);
  }

  async setProductCatalog(key: string, data: any, ttl?: number): Promise<void> {
    return this.set(key, data, ttl ?? CACHE_TTL.PRODUCT_CATALOG);
  }

  async invalidateProducts(): Promise<void> {
    await this.delete(CacheKeys.productsFeatured());
  }

  async checkRateLimit(identifier: string, max: number, ttlSeconds: number): Promise<boolean> {
    const key = CacheKeys.rateLimit(identifier);
    const current = await this.get<{ count: number }>(key);

    if (!current) {
      await this.set(key, { count: 1 }, ttlSeconds);
      return true;
    }

    if (current.count >= max) return false;

    await this.set(key, { count: current.count + 1 }, ttlSeconds);
    return true;
  }
}

let cacheRepo: CacheRepository | null = null;

export function getCacheRepository(kv: KVNamespace): CacheRepository {
  if (cacheRepo) return cacheRepo;
  cacheRepo = new KVCacheRepository(kv);
  return cacheRepo;
}
