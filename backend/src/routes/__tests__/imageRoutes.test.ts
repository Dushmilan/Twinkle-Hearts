import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import imageRoutes from '../imageRoutes.js';
import type { Env } from '../../types.js';

interface R2Object {
  body: string;
  httpEtag?: string;
}

function createTestApp(getImpl: (path: string) => R2Object | null) {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/images', imageRoutes);
  const R2 = { get: vi.fn(async (path: string): Promise<R2Object | null> => getImpl(path)) };
  const env = { R2 } as unknown as Env;
  return { app, R2, env };
}

describe('imageRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serves an object with content type, cache headers, and etag', async () => {
    const { app, R2, env } = createTestApp(() => ({ body: 'bytes', httpEtag: '"v1"' }));

    const res = await app.request('/images/products/a.jpg', {}, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(res.headers.get('ETag')).toBe('"v1"');
    expect(R2.get).toHaveBeenCalledWith('products/a.jpg');
  });

  it('maps png content types and omits missing etags', async () => {
    const { app, env } = createTestApp(() => ({ body: 'bytes' }));

    const res = await app.request('/images/x.png', {}, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('ETag')).toBeNull();
  });

  it('falls back to octet-stream for unknown extensions', async () => {
    const { app, env } = createTestApp(() => ({ body: 'bytes' }));

    const res = await app.request('/images/file.bin', {}, env);

    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  });

  it('returns 304 when If-None-Match matches the etag', async () => {
    const { app, env } = createTestApp(() => ({ body: 'bytes', httpEtag: '"v1"' }));

    const res = await app.request(
      '/images/a.webp',
      { headers: { 'If-None-Match': '"v1"' } },
      env,
    );

    expect(res.status).toBe(304);
  });

  it('returns 404 for a missing object and for an empty path', async () => {
    const { app, env } = createTestApp(() => null);

    expect((await app.request('/images/gone.jpg', {}, env)).status).toBe(404);
    expect((await app.request('/images/', {}, env)).status).toBe(404);
  });
});
