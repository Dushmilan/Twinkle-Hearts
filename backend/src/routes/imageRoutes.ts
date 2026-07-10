import { Hono } from 'hono';
import type { Env } from '../types.js';

const router = new Hono<{ Bindings: Env }>();

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

router.get('/*', async (c) => {
  const path = c.req.path.replace(/^\/images\/?/, '');
  if (!path) return c.notFound();

  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

  const object = await c.env.R2.get(path);
  if (!object) return c.notFound();

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  const etag = object.httpEtag;
  if (etag) headers.set('ETag', etag);

  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(object.body, { headers });
});

export default router;
