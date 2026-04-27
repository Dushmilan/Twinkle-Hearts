/**
 * Unit Tests for Auth Middleware
 * Tests token extraction, validation, role checks, and missing token handling
 */

import { Request, Response } from 'express';

// Mock modules BEFORE any imports from them
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDelete = jest.fn();
const mockSessionFindUnique = jest.fn();

jest.mock('../../../src/lib/cache.js', () => ({
  __esModule: true,
  cacheGet: (...args: any[]) => mockCacheGet(...args),
  cacheSet: (...args: any[]) => mockCacheSet(...args),
  cacheDelete: (...args: any[]) => mockCacheDelete(...args),
  CACHE_TTL: { SESSION: 604800 },
  CacheKeys: {
    session: (sessionId: string) => `session:${sessionId}`,
    user: (userId: string) => `user:${userId}`,
  },
}));

jest.mock('../../../src/lib/prisma.js', () => ({
  __esModule: true,
  default: {
    session: {
      findUnique: () => mockSessionFindUnique(),
    },
  },
}));

jest.mock('../../../src/lib/jwt.js', () => ({
  __esModule: true,
  signAccessToken: jest.fn().mockResolvedValue('mocked-jwt-token'),
  verifyToken: jest.fn().mockImplementation(async (token: string) => {
    if (token === 'mocked-jwt-token') {
      return {
        sub: 'test-user-id',
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
        sessionId: 'test-session-id',
      };
    }
    return null;
  }),
}));

import { authenticate, requireRole, requireAdmin, optionalAuth } from '../../../src/middleware/auth.js';
import { UnauthorizedError, ForbiddenError } from '../../../src/middleware/errorHandler.js';

function createMockRequest(authHeader?: string, body: any = {}) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
    body,
    user: undefined,
  } as unknown as Request;
  return req;
}

function createMockResponse() {
  return {} as Response;
}

function createMockNext() {
  return jest.fn();
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() with valid token and cached session', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce({ userId: 'test-user-id' });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user!.id).toBe('test-user-id');
      expect(req.user!.email).toBe('test@example.com');
      expect(req.user!.role).toBe('CUSTOMER');
    });

    it('should call next() with valid token and DB session (cache miss)', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce(null);
      mockSessionFindUnique.mockResolvedValueOnce({
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 86400000),
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockCacheSet).toHaveBeenCalledWith(
        'session:test-session-id',
        { userId: 'test-user-id' },
        604800
      );
      expect(req.user).toBeDefined();
    });

    it('should NOT call cacheSet when session is in cache (cache hit)', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce({ userId: 'test-user-id' });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockCacheSet).not.toHaveBeenCalled();
      expect(mockSessionFindUnique).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });

    it('should reject request without authorization header', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request with malformed authorization header', async () => {
      const req = createMockRequest('InvalidFormat');
      const res = createMockResponse();
      const next = createMockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request with expired session in DB', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce(null);
      mockSessionFindUnique.mockResolvedValueOnce({
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() - 86400000),
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request with non-existent session', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce(null);
      mockSessionFindUnique.mockResolvedValueOnce(null);

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request with invalid token', async () => {
      const req = createMockRequest('Bearer invalid-token-string');
      const res = createMockResponse();
      const next = createMockNext();

      mockCacheGet.mockResolvedValueOnce(null);

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireRole', () => {
    it('should call next() if user has required role', () => {
      const req = createMockRequest();
      req.user = { id: '1', email: 'test@test.com', role: 'ADMIN', sessionId: 's1' };
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject if user has wrong role', () => {
      const req = createMockRequest();
      req.user = { id: '1', email: 'test@test.com', role: 'CUSTOMER', sessionId: 's1' };
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject if user is not authenticated', () => {
      const req = createMockRequest();
      req.user = undefined;
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should allow any of multiple roles', () => {
      const req = createMockRequest();
      req.user = { id: '1', email: 'test@test.com', role: 'VENDOR', sessionId: 's1' };
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = requireRole('ADMIN', 'VENDOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireAdmin', () => {
    it('should call next() if user is admin', () => {
      const req = createMockRequest();
      req.user = { id: '1', email: 'test@test.com', role: 'ADMIN', sessionId: 's1' };
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject if user is not admin', () => {
      const req = createMockRequest();
      req.user = { id: '1', email: 'test@test.com', role: 'CUSTOMER', sessionId: 's1' };
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token is provided', async () => {
      const req = createMockRequest('Bearer mocked-jwt-token');
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user!.id).toBe('test-user-id');
    });

    it('should call next() without error if no token is provided', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should call next() without error if token is invalid', async () => {
      const req = createMockRequest('Bearer invalid-token');
      const res = createMockResponse();
      const next = createMockNext();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });
  });
});
