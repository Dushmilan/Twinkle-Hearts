import { describe, expect, it } from 'vitest';
import { IdempotencyStore } from '../idempotency-store.js';

const makeCache = () => {
  const map = new Map<string, { value: string; expiresAt: number }>();
  return {
    async get(key: string): Promise<string | null> {
      const entry = map.get(key);
      if (!entry || entry.expiresAt < Date.now()) return null;
      return entry.value;
    },
    async put(key: string, value: string, ttlSeconds: number): Promise<void> {
      map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async delete(key: string): Promise<void> {
      map.delete(key);
    },
  };
};

describe('IdempotencyStore', () => {
  it('stores and replays a completed result', async () => {
    const store = new IdempotencyStore(makeCache());
    expect(await store.get('u1', 'k1')).toBeNull();
    await store.save('u1', 'k1', { requestHash: 'hash-a', orderId: 'o1', statusCode: 201, pending: false });
    expect(await store.get('u1', 'k1')).toEqual({
      requestHash: 'hash-a', orderId: 'o1', statusCode: 201, pending: false,
    });
  });

  it('round-trips the pending marker for concurrent submits', async () => {
    const store = new IdempotencyStore(makeCache());
    await store.save('u1', 'k1', { requestHash: 'hash-a', statusCode: 201, pending: true });
    expect((await store.get('u1', 'k1'))?.pending).toBe(true);
  });

  it('deletes the pending marker so a failed attempt can be retried', async () => {
    const store = new IdempotencyStore(makeCache());
    await store.save('u1', 'k1', { requestHash: 'hash-a', statusCode: 200, pending: true });
    await store.delete('u1', 'k1');
    expect(await store.get('u1', 'k1')).toBeNull();
  });
});
