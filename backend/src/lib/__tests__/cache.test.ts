import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cacheGet, cacheSet, cacheDelete, cacheWrap,
  CacheKeys, CACHE_TTL,
} from '../cache.js';

interface PutCall {
  key: string;
  value: string;
  ttl: number | undefined;
}

function createFakeKV(options: {
  failGet?: boolean;
  failPut?: boolean;
  failDelete?: boolean;
} = {}) {
  const store = new Map<string, string>();
  const puts: PutCall[] = [];
  const deletes: string[] = [];
  const kv = {
    get: vi.fn(async (key: string): Promise<string | null> => {
      if (options.failGet) throw new Error('kv down');
      return store.has(key) ? (store.get(key) as string) : null;
    }),
    put: vi.fn(async (key: string, value: string, putOptions?: { expirationTtl?: number }): Promise<void> => {
      if (options.failPut) throw new Error('kv down');
      store.set(key, value);
      puts.push({ key, value, ttl: putOptions?.expirationTtl });
    }),
    delete: vi.fn(async (key: string): Promise<void> => {
      if (options.failDelete) throw new Error('kv down');
      store.delete(key);
      deletes.push(key);
    }),
  };
  return { store, puts, deletes, kv: kv as unknown as KVNamespace };
}

describe('cache helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('cacheGet', () => {
    it('returns parsed JSON on a hit', async () => {
      const { store, kv } = createFakeKV();
      store.set('twinkle-hearts:session:abc', JSON.stringify({ userId: 'u1' }));

      await expect(cacheGet<{ userId: string }>(kv, 'session:abc')).resolves.toEqual({ userId: 'u1' });
    });

    it('returns null on a miss', async () => {
      const { kv } = createFakeKV();

      await expect(cacheGet(kv, 'missing')).resolves.toBeNull();
    });

    it('returns null for invalid JSON instead of throwing', async () => {
      const { store, kv } = createFakeKV();
      store.set('twinkle-hearts:bad', 'not-json{{{');

      await expect(cacheGet(kv, 'bad')).resolves.toBeNull();
    });

    it('returns null when KV throws', async () => {
      const { kv } = createFakeKV({ failGet: true });

      await expect(cacheGet(kv, 'any')).resolves.toBeNull();
    });
  });

  describe('cacheSet', () => {
    it('writes prefixed JSON with the default TTL', async () => {
      const { store, puts, kv } = createFakeKV();

      await cacheSet(kv, 'user:u1', { name: 'Ann' });

      expect(store.get('twinkle-hearts:user:u1')).toBe(JSON.stringify({ name: 'Ann' }));
      expect(puts[0].ttl).toBe(CACHE_TTL.USER_PROFILE);
    });

    it('honours a custom TTL', async () => {
      const { puts, kv } = createFakeKV();

      await cacheSet(kv, 'otp:x', { code: '123' }, CACHE_TTL.OTP);

      expect(puts[0]).toMatchObject({ key: 'twinkle-hearts:otp:x', ttl: CACHE_TTL.OTP });
    });

    it('swallows KV errors without throwing', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { kv } = createFakeKV({ failPut: true });

      await expect(cacheSet(kv, 'k', { v: 1 })).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('cacheDelete', () => {
    it('deletes the prefixed key', async () => {
      const { store, deletes, kv } = createFakeKV();
      store.set('twinkle-hearts:s', '1');

      await cacheDelete(kv, 's');

      expect(store.has('twinkle-hearts:s')).toBe(false);
      expect(deletes).toEqual(['twinkle-hearts:s']);
    });

    it('swallows KV errors without throwing', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { kv } = createFakeKV({ failDelete: true });

      await expect(cacheDelete(kv, 's')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('cacheWrap', () => {
    it('returns the cached value without calling fn on a hit', async () => {
      const { store, kv } = createFakeKV();
      store.set('twinkle-hearts:w', JSON.stringify('cached'));
      const fn = vi.fn(async () => 'fresh');

      await expect(cacheWrap(kv, 'w', fn)).resolves.toBe('cached');
      expect(fn).not.toHaveBeenCalled();
    });

    it('calls fn, caches, and returns the result on a miss', async () => {
      const { store, kv } = createFakeKV();
      const fn = vi.fn(async () => ({ fresh: true }));

      const result = await cacheWrap(kv, 'w', fn, 60);

      expect(result).toEqual({ fresh: true });
      expect(store.get('twinkle-hearts:w')).toBe(JSON.stringify({ fresh: true }));
    });
  });

  describe('CacheKeys + CACHE_TTL', () => {
    it('builds stable key strings', () => {
      expect(CacheKeys.session('s1')).toBe('session:s1');
      expect(CacheKeys.user('u1')).toBe('user:u1');
      expect(CacheKeys.userOrders('u1')).toBe('user:orders:u1');
      expect(CacheKeys.userWishlist('u1')).toBe('user:wishlist:u1');
      expect(CacheKeys.userAddresses('u1')).toBe('user:addresses:u1');
      expect(CacheKeys.product('p1')).toBe('product:p1');
      expect(CacheKeys.productsCatalog(2, 20)).toBe('products:catalog:2:20');
      expect(CacheKeys.productsCatalogPrefix()).toBe('products:catalog:');
      expect(CacheKeys.productsFeatured()).toBe('products:featured');
      expect(CacheKeys.adminStats()).toBe('admin:stats');
      expect(CacheKeys.otp('+9477')).toBe('otp:+9477');
      expect(CacheKeys.rateLimit('1.2.3.4')).toBe('ratelimit:1.2.3.4');
    });

    it('defines positive TTLs with session longest', () => {
      for (const ttl of Object.values(CACHE_TTL)) expect(ttl).toBeGreaterThan(0);
      expect(CACHE_TTL.SESSION).toBeGreaterThanOrEqual(CACHE_TTL.USER_PROFILE);
    });
  });
});
