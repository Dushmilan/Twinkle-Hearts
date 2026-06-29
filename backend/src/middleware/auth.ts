import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/jwt.js';
import { cacheGet, CacheKeys } from '../lib/cache.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import { getPrisma } from '../lib/prisma.js';
import type { Env, Variables, UserInfo } from '../types.js';

type AuthContext = { Bindings: Env; Variables: Variables };

export async function authenticate(c: Context<AuthContext>, next: Next) {
  try {
    const authHeader = c.req.header('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken<any>(
      token,
      c.env.JWT_PRIVATE_KEY,
      c.env.JWT_PUBLIC_KEY
    );

    if (!payload) {
      throw new UnauthorizedError('Invalid token');
    }

    const sessionKey = CacheKeys.session(payload.sessionId);
    const session = await cacheGet<{ userId: string }>(c.env.KV, sessionKey);

    if (!session) {
      const prisma = getPrisma(c.env.DB);
      const dbSession = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: { userId: true, expiresAt: true },
      });

      if (!dbSession || new Date(dbSession.expiresAt) < new Date()) {
        throw new UnauthorizedError('Session expired');
      }
    }

    c.set('user', {
      userId: payload.sub || payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    });

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Authentication failed');
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context<AuthContext>, next: Next) => {
    const user = c.get('user');
    if (!user) throw new UnauthorizedError('Authentication required');
    if (!roles.includes(user.role)) {
      throw new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
    }
    await next();
  };
}

export const requireAdmin = requireRole('ADMIN');
