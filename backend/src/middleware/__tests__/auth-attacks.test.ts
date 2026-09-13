import { describe, expect, it, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { generateKeyPair, SignJWT, exportSPKI, exportPKCS8 } from 'jose';

vi.mock('../../lib/cache/index.js');
vi.mock('../../lib/prisma.js');

import { getCacheRepository } from '../../lib/cache/index.js';
import { authenticate } from '../auth.js';
import { errorHandler } from '../errorHandler.js';
import type { CacheRepository } from '../../lib/cache/cache-repository.js';
import type { Env, Variables } from '../../types.js';

let signKey: CryptoKey;
let testEnv: Env;

const payload = { userId: 'u1', email: 't@e.com', role: 'CUSTOMER', sessionId: 's1' };

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  signKey = pair.privateKey as CryptoKey;
  // authenticate -> verifyToken reads BOTH PEMs (private load happens before
  // verify), so the env must carry the real pair, not just the public half.
  testEnv = {
    JWT_PRIVATE_KEY: await exportPKCS8(pair.privateKey),
    JWT_PUBLIC_KEY: await exportSPKI(pair.publicKey),
    KV: {},
    DB: {},
  } as unknown as Env;
  vi.mocked(getCacheRepository).mockReturnValue({
    getSession: vi.fn(async () => ({ userId: 'u1' })),
  } as unknown as CacheRepository);
});

const mint = (claims: Record<string, unknown>, key: CryptoKey = signKey): Promise<string> =>
  new SignJWT({ ...payload, ...claims })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject('u1')
    .setExpirationTime('5m')
    .sign(key);

const toBase64Url = (value: unknown): string =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const callAuthed = async (token?: string): Promise<Response> => {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  app.use('*', authenticate);
  app.get('/me', (c) => c.json({ ok: true }));
  app.onError(errorHandler);
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  return app.request('/me', { headers }, testEnv);
};

describe('jwt attacks', () => {
  it('rejects request with no token', async () => {
    expect((await callAuthed()).status).toBe(401);
  });

  it('accepts a valid token (control)', async () => {
    expect((await callAuthed(await mint({}))).status).toBe(200);
  });

  it('rejects expired token', async () => {
    const expired = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('u1')
      .setExpirationTime(new Date(Date.now() - 3600_000))
      .sign(signKey);
    expect((await callAuthed(expired)).status).toBe(401);
  });

  it('rejects tampered payload', async () => {
    const good = await mint({});
    const parts = good.split('.');
    const forged = toBase64Url({ ...payload, role: 'ADMIN' });
    expect((await callAuthed(`${parts[0]}.${forged}.${parts[2]}`)).status).toBe(401);
  });

  it('rejects alg=none token', async () => {
    const noneHeader = toBase64Url({ alg: 'none', typ: 'JWT' });
    const body = toBase64Url(payload);
    expect((await callAuthed(`${noneHeader}.${body}.`)).status).toBe(401);
  });

  it('rejects token signed by a different key', async () => {
    const other = await generateKeyPair('RS256');
    const forged = await mint({}, other.privateKey as CryptoKey);
    expect((await callAuthed(forged)).status).toBe(401);
  });

  it('maps unexpected session-store failures to Authentication failed', async () => {
    vi.mocked(getCacheRepository).mockReturnValueOnce({
      getSession: vi.fn(async () => {
        throw new Error('kv down');
      }),
    } as unknown as CacheRepository);

    const res = await callAuthed(await mint({}));

    expect(res.status).toBe(401);
    expect(await res.text()).toContain('Authentication failed');
  });
});
