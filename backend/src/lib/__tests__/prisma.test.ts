import { describe, it, expect, vi } from 'vitest';

const stubs = vi.hoisted(() => {
  const txClient = { user: { tag: 'tx-user' } };
  const client = {
    user: { tag: 'user' },
    product: { tag: 'product' },
    order: { tag: 'order' },
    session: { tag: 'session' },
    address: { tag: 'address' },
    wishlist: { tag: 'wishlist' },
    orderItem: { tag: 'orderItem' },
    adminLog: { tag: 'adminLog' },
    $transaction: (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => fn(txClient),
  };
  return {
    client,
    txClient,
    PrismaClient: vi.fn(() => client),
    PrismaD1: vi.fn((db: unknown) => ({ db })),
  };
});

vi.mock('@prisma/client', () => ({ PrismaClient: stubs.PrismaClient }));
vi.mock('@prisma/adapter-d1', () => ({ PrismaD1: stubs.PrismaD1 }));

import { getPrisma, getPrismaRepository } from '../prisma.js';

const fakeDb = {} as unknown as D1Database;

describe('prisma factories', () => {
  it('getPrisma builds one client from the D1 binding', () => {
    const first = getPrisma(fakeDb);

    expect(getPrisma(fakeDb)).toBe(first);
    expect(stubs.PrismaD1).toHaveBeenCalledWith(fakeDb);
    expect(stubs.PrismaClient).toHaveBeenCalled();
  });

  it('getPrismaRepository exposes every delegate as a singleton', () => {
    const first = getPrismaRepository(fakeDb);

    expect(getPrismaRepository(fakeDb)).toBe(first);
    expect(first.user).toBe(stubs.client.user);
    expect(first.product).toBe(stubs.client.product);
    expect(first.order).toBe(stubs.client.order);
    expect(first.session).toBe(stubs.client.session);
    expect(first.address).toBe(stubs.client.address);
    expect(first.wishlist).toBe(stubs.client.wishlist);
    expect(first.orderItem).toBe(stubs.client.orderItem);
    expect(first.adminLog).toBe(stubs.client.adminLog);
  });

  it('$transaction runs the callback against a wrapped transaction client', async () => {
    const repo = getPrismaRepository(fakeDb);

    const result = await repo.$transaction(async (tx) => {
      expect((tx.user as unknown as { tag: string }).tag).toBe('tx-user');
      return 'done';
    });

    expect(result).toBe('done');
  });
});
