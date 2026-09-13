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

// Deterministic JSON canonicalization: object keys sorted recursively, so
// semantically identical payloads hash identically regardless of key order or
// whitespace. Arrays keep order (item order is semantically significant).
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

export interface IdempotencyRequestPayload {
  items: Array<{ productId: string; quantity: number; currentPrice: number; productName: string; frontendPrice?: number }>;
  customerName: string;
  customerPhone: string;
}

// Canonical hash over the VALIDATED payload (server-hydrated items + customer
// fields), not the raw body bytes. A client retry that re-stringifies identical
// JSON (different key order / whitespace) replays; a genuinely different
// payload still 422s. Hashing validated data also removes the second body read
// in the route (validation already consumed the body via c.req.json()).
export function hashIdempotencyPayload(payload: IdempotencyRequestPayload): string {
  return hashRequestBody(stableStringify(payload));
}

// FNV-1a 64-bit over a string (sync; node:crypto is forbidden on the Workers
// runtime). Low-level primitive — prefer hashIdempotencyPayload for request
// comparison.
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
