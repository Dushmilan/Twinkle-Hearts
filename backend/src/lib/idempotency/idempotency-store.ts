export interface IdempotencyRecord {
  requestHash: string;
  orderId?: string;
  statusCode: number;
  pending: boolean;
}

export interface IdempotencyCache {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export class IdempotencyStore {
  constructor(
    private readonly cache: IdempotencyCache,
    private readonly ttlSeconds = 86400,
  ) {}

  private key(userId: string, key: string): string {
    return `idempotency:order:${userId}:${key}`;
  }

  async get(userId: string, key: string): Promise<IdempotencyRecord | null> {
    const raw = await this.cache.get(this.key(userId, key));
    return raw ? (JSON.parse(raw) as IdempotencyRecord) : null;
  }

  async save(userId: string, key: string, record: IdempotencyRecord): Promise<void> {
    await this.cache.put(this.key(userId, key), JSON.stringify(record), this.ttlSeconds);
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.cache.delete(this.key(userId, key));
  }
}

export function hashRequestBody(raw: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < raw.length; i++) {
    hash ^= BigInt(raw.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}
