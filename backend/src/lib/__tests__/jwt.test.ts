import { describe, it, expect, beforeAll, vi } from 'vitest';
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import { signAccessToken, signRefreshToken, verifyToken } from '../jwt.js';

interface AccessPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  sub?: string;
  exp?: number;
}

let privatePEM: string;
let publicPEM: string;
let wrongPublicPEM: string;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privatePEM = await exportPKCS8(pair.privateKey);
  publicPEM = await exportSPKI(pair.publicKey);
  const other = await generateKeyPair('RS256');
  wrongPublicPEM = await exportSPKI(other.publicKey);
});

describe('jwt lib', () => {
  it('round-trips an access token with subject = userId', async () => {
    const token = await signAccessToken(
      { userId: 'u1', email: 'a@b.c', role: 'ADMIN', sessionId: 's1' },
      privatePEM,
    );

    const payload = await verifyToken<AccessPayload>(token, privatePEM, publicPEM);

    expect(payload).toMatchObject({ userId: 'u1', email: 'a@b.c', role: 'ADMIN', sessionId: 's1', sub: 'u1' });
    expect(typeof payload?.exp).toBe('number');
  });

  it('round-trips a refresh token', async () => {
    const token = await signRefreshToken({ userId: 'u2', sessionId: 's2' }, privatePEM);

    const payload = await verifyToken<{ userId: string; sessionId: string; sub?: string }>(
      token,
      privatePEM,
      publicPEM,
    );

    expect(payload).toMatchObject({ userId: 'u2', sessionId: 's2', sub: 'u2' });
  });

  it('returns null for malformed tokens', async () => {
    await expect(verifyToken('not-a-token', privatePEM, publicPEM)).resolves.toBeNull();
  });

  it('returns null when verified against a different key', async () => {
    // Module-level key cache means this needs a fresh module instance:
    // otherwise the correct public key cached above would verify the token.
    vi.resetModules();
    const fresh = await import('../jwt.js');
    const token = await fresh.signAccessToken(
      { userId: 'u1', email: 'a@b.c', role: 'CUSTOMER', sessionId: 's1' },
      privatePEM,
    );

    await expect(fresh.verifyToken(token, privatePEM, wrongPublicPEM)).resolves.toBeNull();
  });
});
