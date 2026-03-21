// Authentication middleware
// Private Commercial Project - Confidential

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { cacheGet, CacheKeys } from '../lib/cache.js';
import prisma from '../lib/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../middleware/errorHandler.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        sessionId: string;
      };
    }
  }
}

/**
 * Authenticate user via JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = await verifyToken<any>(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid token');
    }

    // Check if session exists in cache
    const sessionKey = CacheKeys.session(payload.sessionId);
    const session = await cacheGet(sessionKey);

    if (!session) {
      // Session not in cache - check database
      const dbSession = await prisma.session.findUnique({
        where: { id: payload.sessionId },
        select: { userId: true, expiresAt: true },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) {
        throw new UnauthorizedError('Session expired');
      }

      // Cache the session
      const { cacheSet, CACHE_TTL } = await import('../lib/cache.js');
      await cacheSet(sessionKey, { userId: dbSession.userId }, CACHE_TTL.SESSION);
    }

    // Attach user to request
    req.user = {
      id: payload.sub || payload.userId,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * Require specific role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyToken<any>(token);

      if (payload) {
        req.user = {
          id: payload.sub || payload.userId,
          email: payload.email,
          role: payload.role,
          sessionId: payload.sessionId,
        };
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};
