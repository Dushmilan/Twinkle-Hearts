export interface IdempotencyOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface IdempotencyOrderResponse {
  orderId: string;
  items: IdempotencyOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  whatsappDeepLink: string;
  createdAt: string;
}

export interface IdempotencyRecord {
  requestHash: string;
  orderId?: string;
  statusCode: number;
  pending: boolean;
  response?: IdempotencyOrderResponse;
}

export interface IdempotencyCache {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export const IDEMPOTENCY_RESULT_TTL_SECONDS = 86400;
export const IDEMPOTENCY_PENDING_TTL_SECONDS = 120;

export class IdempotencyStore {
  constructor(
    private readonly cache: IdempotencyCache,
    private readonly ttlSeconds = IDEMPOTENCY_RESULT_TTL_SECONDS,
  ) {}

  private key(userId: string, key: string): string {
    return `idempotency:order:${userId}:${key}`;
  }

  async get(userId: string, key: string): Promise<IdempotencyRecord | null> {
    const raw = await this.cache.get(this.key(userId, key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IdempotencyRecord;
    } catch {
      return null;
    }
  }

  async save(
    userId: string,
    key: string,
    record: IdempotencyRecord,
    ttlSeconds = this.ttlSeconds,
  ): Promise<void> {
    await this.cache.put(this.key(userId, key), JSON.stringify(record), ttlSeconds);
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.cache.delete(this.key(userId, key));
  }
}

// FNV-1a 64-bit over the RAW request body bytes (sync; node:crypto is forbidden
// on the Workers runtime). Canonical-body requirement: the hash is
// whitespace- and key-order-sensitive, so logically identical payloads that are
// serialized differently hash differently. Clients must retry with a
// byte-identical body under the same Idempotency-Key; otherwise a same-key
// retry is correctly rejected with 422 as a payload mismatch.
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
