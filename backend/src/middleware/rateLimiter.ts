import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env, Variables } from '../types.js';

type RLContext = { Bindings: Env; Variables: Variables };

export async function apiLimiter(c: Context<RLContext>, next: Next) {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const key = `ratelimit:api:${ip}`;

  try {
    const current = await c.env.KV.get(key, 'text');
    const count = current ? parseInt(current) : 0;
    const maxRequests = 100;

    if (count >= maxRequests) {
      throw new HTTPException(429, { message: 'Too many requests, please try again later' });
    }

    await c.env.KV.put(key, (count + 1).toString(), {
      expirationTtl: 900,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
  }

  await next();
}

export async function orderRateLimit(c: Context<RLContext>, next: Next) {
  const user = c.get('user');
  const userId = user?.userId;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const identifier = userId || ip;
  const key = `ratelimit:order:${identifier}`;

  try {
    const current = await c.env.KV.get(key, 'text');
    const count = current ? parseInt(current) : 0;
    const maxOrders = 5;

    if (count >= maxOrders) {
      throw new HTTPException(429, { message: 'Too many order attempts, please try again later' });
    }

    await c.env.KV.put(key, (count + 1).toString(), {
      expirationTtl: 900,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
  }

  await next();
}
