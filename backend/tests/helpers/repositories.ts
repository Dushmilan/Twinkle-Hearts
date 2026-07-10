import type { CacheRepository, SessionData, PaginatedData } from '../../src/lib/cache/cache-repository.js';

/**
 * In-memory store for a single model/table.
 * Stores records keyed by their `id` property.
 */
class InMemoryTable<T extends { id: string }> {
  private records = new Map<string, T>();

  all(): T[] {
    return Array.from(this.records.values());
  }

  byId(id: string): T | undefined {
    return this.records.get(id);
  }

  insert(record: T): T {
    this.records.set(record.id, record);
    return record;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const existing = this.records.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data } as T;
    this.records.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.records.delete(id);
  }

  deleteMany(predicate?: (r: T) => boolean): number {
    if (!predicate) {
      const count = this.records.size;
      this.records.clear();
      return count;
    }
    let count = 0;
    for (const [id, record] of this.records) {
      if (predicate(record)) {
        this.records.delete(id);
        count++;
      }
    }
    return count;
  }

  query(predicate: (r: T) => boolean): T[] {
    return Array.from(this.records.values()).filter(predicate);
  }

  findOne(predicate: (r: T) => boolean): T | undefined {
    return Array.from(this.records.values()).find(predicate);
  }

  clear(): void {
    this.records.clear();
  }

  get size(): number {
    return this.records.size;
  }
}

/**
 * Simplified transaction client wrapping in-memory tables.
 */
export class InMemoryTransactionClient {
  readonly user: InMemoryTable<any>;
  readonly product: InMemoryTable<any>;
  readonly order: InMemoryTable<any>;
  readonly session: InMemoryTable<any>;
  readonly address: InMemoryTable<any>;
  readonly wishlist: InMemoryTable<any>;
  readonly orderItem: InMemoryTable<any>;
  readonly adminLog: InMemoryTable<any>;

  constructor(tables: {
    user: InMemoryTable<any>;
    product: InMemoryTable<any>;
    order: InMemoryTable<any>;
    session: InMemoryTable<any>;
    address: InMemoryTable<any>;
    wishlist: InMemoryTable<any>;
    orderItem: InMemoryTable<any>;
    adminLog: InMemoryTable<any>;
  }) {
    this.user = tables.user;
    this.product = tables.product;
    this.order = tables.order;
    this.session = tables.session;
    this.address = tables.address;
    this.wishlist = tables.wishlist;
    this.orderItem = tables.orderItem;
    this.adminLog = tables.adminLog;
  }
}

/**
 * In-memory test implementation of database operations.
 * Uses simple Map stores per model instead of a real database.
 * Intended as a test double — adapt to PrismaRepository in Phase 1.
 */
export class TestPrismaRepository {
  readonly user: InMemoryTable<any>;
  readonly product: InMemoryTable<any>;
  readonly order: InMemoryTable<any>;
  readonly session: InMemoryTable<any>;
  readonly address: InMemoryTable<any>;
  readonly wishlist: InMemoryTable<any>;
  readonly orderItem: InMemoryTable<any>;
  readonly adminLog: InMemoryTable<any>;

  private readonly tables: {
    user: InMemoryTable<any>;
    product: InMemoryTable<any>;
    order: InMemoryTable<any>;
    session: InMemoryTable<any>;
    address: InMemoryTable<any>;
    wishlist: InMemoryTable<any>;
    orderItem: InMemoryTable<any>;
    adminLog: InMemoryTable<any>;
  };

  constructor() {
    this.user = new InMemoryTable<any>();
    this.product = new InMemoryTable<any>();
    this.order = new InMemoryTable<any>();
    this.session = new InMemoryTable<any>();
    this.address = new InMemoryTable<any>();
    this.wishlist = new InMemoryTable<any>();
    this.orderItem = new InMemoryTable<any>();
    this.adminLog = new InMemoryTable<any>();

    this.tables = {
      user: this.user,
      product: this.product,
      order: this.order,
      session: this.session,
      address: this.address,
      wishlist: this.wishlist,
      orderItem: this.orderItem,
      adminLog: this.adminLog,
    };
  }

  async $transaction<T>(fn: (tx: { user: InMemoryTable<any>; product: InMemoryTable<any>; order: InMemoryTable<any>; session: InMemoryTable<any>; address: InMemoryTable<any>; wishlist: InMemoryTable<any>; orderItem: InMemoryTable<any>; adminLog: InMemoryTable<any> }) => Promise<T>): Promise<T> {
    const txClient = new InMemoryTransactionClient(this.tables);
    return fn({
      user: txClient.user,
      product: txClient.product,
      order: txClient.order,
      session: txClient.session,
      address: txClient.address,
      wishlist: txClient.wishlist,
      orderItem: txClient.orderItem,
      adminLog: txClient.adminLog,
    });
  }

  clearAll(): void {
    for (const table of Object.values(this.tables)) {
      table.clear();
    }
  }
}

/**
 * In-memory test implementation of CacheRepository.
 * Uses a simple Map instead of KV namespace.
 */
export class TestCacheRepository implements CacheRepository {
  private store = new Map<string, { value: any; expiresAt: number | null }>();
  private defaultTtl = 300;

  private isExpired(entry: { value: any; expiresAt: number | null }): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    this.store.set(key, {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, data: SessionData, ttl?: number): Promise<void> {
    return this.set(`session:${sessionId}`, data, ttl);
  }

  async invalidateSession(sessionId: string): Promise<void> {
    return this.delete(`session:${sessionId}`);
  }

  async getUserOrders(userId: string): Promise<PaginatedData<any> | null> {
    return this.get(`user:orders:${userId}`);
  }

  async setUserOrders(userId: string, data: PaginatedData<any>, ttl?: number): Promise<void> {
    return this.set(`user:orders:${userId}`, data, ttl);
  }

  async invalidateUserOrders(userId: string): Promise<void> {
    return this.delete(`user:orders:${userId}`);
  }

  async getProductCatalog(key: string): Promise<any | null> {
    return this.get(`products:catalog:${key}`);
  }

  async setProductCatalog(key: string, data: any, ttl?: number): Promise<void> {
    return this.set(`products:catalog:${key}`, data, ttl);
  }

  async invalidateProducts(): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith('products:')) {
        this.store.delete(key);
      }
    }
  }

  async checkRateLimit(identifier: string, max: number, ttlSeconds: number): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const current = await this.get(key);
    const count = current ? (current as { count: number }).count : 0;

    if (count >= max) return false;

    await this.set(key, { count: count + 1 }, ttlSeconds);
    return true;
  }

  /** Clears all cached data - call in beforeEach */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instances for test convenience
export const testRepo = new TestPrismaRepository();
export const testCache = new TestCacheRepository();
