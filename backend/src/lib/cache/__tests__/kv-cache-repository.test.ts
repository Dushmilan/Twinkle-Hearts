import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KVCacheRepository, getCacheRepository } from '../kv-cache-repository.js';
import { CACHE_TTL } from '../../cache.js';

interface KVListResult {
  keys: Array<{ name: string }>;
  list_complete: boolean;
  cursor?: string;
}

function createFakeKV(options: {
  failGet?: boolean;
  failPut?: boolean;
  failDelete?: boolean;
  failList?: boolean;
  pages?: string[][];
} = {}) {
  const store = new Map<string, string>();
  const puts: Array<{ key: string; value: string; ttl: number | undefined }> = [];
  let listCalls = 0;
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
    }),
    list: vi.fn(async (): Promise<KVListResult> => {
      if (options.failList) throw new Error('kv down');
      if (!options.pages) {
        return { keys: [...store.keys()].map((name) => ({ name })), list_complete: true };
      }
      const page = options.pages[Math.min(listCalls, options.pages.length - 1)];
      listCalls += 1;
      const last = listCalls >= options.pages.length;
      return {
        keys: page.map((name) => ({ name })),
        list_complete: last,
        cursor: last ? undefined : `cursor-${listCalls}`,
      };
    }),
  };
  return { store, puts, kv: kv as unknown as KVNamespace };
}

describe('KVCacheRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('get/set/delete', () => {
    it('round-trips JSON values with the shared prefix', async () => {
      const { store, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);

      await repo.set('k', { a: 1 });
      expect(store.get('twinkle-hearts:k')).toBe('{"a":1}');
      await expect(repo.get('k')).resolves.toEqual({ a: 1 });
    });

    it('returns null on miss, invalid JSON, and KV errors', async () => {
      const { store, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);
      store.set('twinkle-hearts:bad', 'nope{{{');

      await expect(repo.get('missing')).resolves.toBeNull();
      await expect(repo.get('bad')).resolves.toBeNull();
      const failing = new KVCacheRepository(createFakeKV({ failGet: true }).kv);
      await expect(failing.get('k')).resolves.toBeNull();
    });

    it('uses the default TTL unless overridden', async () => {
      const { puts, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);

      await repo.set('a', 1);
      await repo.set('b', 2, 99);

      expect(puts[0].ttl).toBe(CACHE_TTL.USER_PROFILE);
      expect(puts[1].ttl).toBe(99);
    });

    it('swallows set/delete errors', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const failing = new KVCacheRepository(
        createFakeKV({ failPut: true, failDelete: true }).kv,
      );

      await expect(failing.set('k', 1)).resolves.toBeUndefined();
      await expect(failing.delete('k')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('deletes by full prefixed key', async () => {
      const { store, kv } = createFakeKV();
      store.set('twinkle-hearts:k', '1');
      const repo = new KVCacheRepository(kv);

      await repo.delete('k');

      expect(store.has('twinkle-hearts:k')).toBe(false);
    });
  });

  describe('deleteByPrefix', () => {
    it('deletes every listed key across paginated results', async () => {
      const pages = [['twinkle-hearts:a:1', 'twinkle-hearts:a:2'], ['twinkle-hearts:a:3']];
      const { store, kv } = createFakeKV({ pages });
      for (const name of pages.flat()) store.set(name, 'v');
      const repo = new KVCacheRepository(kv);

      await repo.deleteByPrefix('a:');

      for (const name of pages.flat()) expect(store.has(name)).toBe(false);
    });

    it('swallows list errors', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const repo = new KVCacheRepository(createFakeKV({ failList: true }).kv);

      await expect(repo.deleteByPrefix('a:')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('domain helpers', () => {
    it('manages sessions under the session key', async () => {
      const { store, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);

      await repo.setSession('s1', { userId: 'u1' });
      expect(store.has('twinkle-hearts:session:s1')).toBe(true);
      await expect(repo.getSession('s1')).resolves.toEqual({ userId: 'u1' });
      await repo.invalidateSession('s1');
      await expect(repo.getSession('s1')).resolves.toBeNull();
    });

    it('manages user orders with the orders TTL by default', async () => {
      const { puts, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);
      const data = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      await repo.setUserOrders('u1', data);
      expect(puts[0].ttl).toBe(CACHE_TTL.USER_ORDERS);
      await expect(repo.getUserOrders('u1')).resolves.toEqual(data);
      await repo.invalidateUserOrders('u1');
      await expect(repo.getUserOrders('u1')).resolves.toBeNull();
    });

    it('manages the product catalog with the catalog TTL by default', async () => {
      const { puts, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);

      await repo.setProductCatalog('catalog:1:20', { items: [] });
      expect(puts[0].ttl).toBe(CACHE_TTL.PRODUCT_CATALOG);
      await expect(repo.getProductCatalog('catalog:1:20')).resolves.toEqual({ items: [] });
      await repo.invalidateProducts();
    });
  });

  describe('checkRateLimit', () => {
    it('allows the first hit and stores count 1', async () => {
      const { kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);

      await expect(repo.checkRateLimit('ip', 2, 60)).resolves.toBe(true);
      await expect(repo.get('ratelimit:ip')).resolves.toEqual({ count: 1 });
    });

    it('increments below the max and blocks at/above it', async () => {
      const { store, kv } = createFakeKV();
      const repo = new KVCacheRepository(kv);
      store.set('twinkle-hearts:ratelimit:ip', JSON.stringify({ count: 1 }));

      await expect(repo.checkRateLimit('ip', 2, 60)).resolves.toBe(true);
      await expect(repo.get('ratelimit:ip')).resolves.toEqual({ count: 2 });
      await expect(repo.checkRateLimit('ip', 2, 60)).resolves.toBe(false);
      await expect(repo.checkRateLimit('ip', 1, 60)).resolves.toBe(false);
    });
  });

  describe('getCacheRepository', () => {
    it('returns a singleton per module', () => {
      const { kv } = createFakeKV();

      expect(getCacheRepository(kv)).toBe(getCacheRepository(kv));
    });
  });
});
