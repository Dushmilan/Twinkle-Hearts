import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context } from 'hono';

vi.mock('../../lib/jwt.js');
vi.mock('../../lib/cache/index.js');
vi.mock('../../lib/prisma.js');

import { verifyToken } from '../../lib/jwt.js';
import { getCacheRepository } from '../../lib/cache/index.js';
import { getPrisma, getPrismaRepository } from '../../lib/prisma.js';
import { authenticate, requireRole, requireAdmin } from '../auth.js';
import { UnauthorizedError, ForbiddenError } from '../errorHandler.js';

function createMockContext(overrides: any = {}): any {
  return {
    req: {
      header: vi.fn(overrides.header || (() => null)),
    },
    env: {
      JWT_PRIVATE_KEY: 'private-key',
      JWT_PUBLIC_KEY: 'public-key',
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
      DB: {} as any,
    },
    set: vi.fn(),
    ...overrides,
  };
}

describe('authenticate middleware', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  let mockCache: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache = {
      getSession: vi.fn(),
      setSession: vi.fn(),
      invalidateSession: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    vi.mocked(getCacheRepository).mockReturnValue(mockCache as any);
    mockContext = createMockContext({
      req: {
        header: vi.fn(() => 'Bearer valid-token'),
      },
    });
  });

  it('should pass with valid token and valid session', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      sub: 'user-1',
      userId: 'user-1',
      email: 'test@example.com',
      role: 'CUSTOMER',
      sessionId: 'session-1',
    });
    mockCache.getSession.mockResolvedValue({ userId: 'user-1' });

    await authenticate(mockContext, nextFn);

    expect(mockContext.set).toHaveBeenCalledWith('user', {
      userId: 'user-1',
      email: 'test@example.com',
      role: 'CUSTOMER',
      sessionId: 'session-1',
    });
    expect(nextFn).toHaveBeenCalled();
  });

  it('should fallback to DB session lookup if cache miss', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'user-1', email: 'test@example.com',
      role: 'CUSTOMER', sessionId: 'session-1',
    });
    mockCache.getSession.mockResolvedValue(null);

    const mockPrisma = { session: { findUnique: vi.fn().mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 86400000) }) } };
    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

    await authenticate(mockContext, nextFn);

    expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      select: { userId: true, expiresAt: true },
    });
    expect(nextFn).toHaveBeenCalled();
  });

  it('should throw if no authorization header', async () => {
    mockContext = createMockContext({
      req: { header: vi.fn(() => null) },
    });

    await expect(authenticate(mockContext, nextFn)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw if header does not start with Bearer', async () => {
    mockContext = createMockContext({
      req: { header: vi.fn(() => 'Basic token') },
    });

    await expect(authenticate(mockContext, nextFn)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw if token is invalid', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);

    await expect(authenticate(mockContext, nextFn)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw if session is expired in DB fallback', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'user-1', email: 'test@example.com',
      role: 'CUSTOMER', sessionId: 'session-1',
    });
    mockCache.getSession.mockResolvedValue(null);

    const mockPrisma = { session: { findUnique: vi.fn().mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() - 86400000) }) } };
    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

    await expect(authenticate(mockContext, nextFn)).rejects.toThrow(UnauthorizedError);
    await expect(authenticate(mockContext, nextFn)).rejects.toThrow('Session expired');
  });

  it('should throw if DB session is not found', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'user-1', email: 'test@example.com',
      role: 'CUSTOMER', sessionId: 'session-1',
    });
    mockCache.getSession.mockResolvedValue(null);

    const mockPrisma = { session: { findUnique: vi.fn().mockResolvedValue(null) } };
    vi.mocked(getPrismaRepository).mockReturnValue(mockPrisma as any);

    await expect(authenticate(mockContext, nextFn)).rejects.toThrow(UnauthorizedError);
  });
});

describe('requireRole middleware', () => {
  it('should pass if user has required role', async () => {
    const mockContext = createMockContext();
    mockContext.get = vi.fn().mockReturnValue({ role: 'ADMIN', userId: 'user-1' });

    const middleware = requireRole('ADMIN');
    await middleware(mockContext, vi.fn());

    expect(mockContext.get).toHaveBeenCalledWith('user');
  });

  it('should throw if user does not have required role', async () => {
    const mockContext = createMockContext();
    mockContext.get = vi.fn().mockReturnValue({ role: 'CUSTOMER', userId: 'user-1' });

    const middleware = requireRole('ADMIN');
    await expect(middleware(mockContext, vi.fn())).rejects.toThrow(ForbiddenError);
  });

  it('should throw if no user in context', async () => {
    const mockContext = createMockContext();
    mockContext.get = vi.fn().mockReturnValue(undefined);

    const middleware = requireRole('ADMIN');
    await expect(middleware(mockContext, vi.fn())).rejects.toThrow(UnauthorizedError);
  });
});

describe('requireAdmin middleware', () => {
  it('should pass for admin users', async () => {
    const mockContext = createMockContext();
    mockContext.get = vi.fn().mockReturnValue({ role: 'ADMIN' });

    await requireAdmin(mockContext, vi.fn());
  });

  it('should throw for non-admin users', async () => {
    const mockContext = createMockContext();
    mockContext.get = vi.fn().mockReturnValue({ role: 'CUSTOMER' });

    await expect(requireAdmin(mockContext, vi.fn())).rejects.toThrow(ForbiddenError);
  });
});
