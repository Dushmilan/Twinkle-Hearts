import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../../services/authService.js');
vi.mock('../../services/userService.js');
vi.mock('../../lib/prisma.js');
vi.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: vi.fn((_c, next) => next()),
  orderRateLimit: vi.fn((_c, next) => next()),
}));
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((c, next) => {
    c.set('user', { userId: 'user-1', email: 'test@example.com', role: 'CUSTOMER', sessionId: 'session-1' });
    return next();
  }),
  requireRole: () => vi.fn((_c, next) => next()),
  requireAdmin: vi.fn((_c, next) => next()),
}));

import authRoutes from '../authRoutes.js';
import * as authService from '../../services/authService.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import type { Env } from '../../types.js';

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/auth', authRoutes);
  app.onError(errorHandler);
  return app;
}

describe('Auth Routes (Integration)', () => {
  let app: Hono<{ Bindings: Env }>;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
    mockEnv = {
      DB: {} as any,
      KV: {} as any,
      JWT_PRIVATE_KEY: 'private',
      JWT_PUBLIC_KEY: 'public',
      JWT_EXPIRES_IN: '7d',
      REFRESH_TOKEN_EXPIRES_IN: '30d',
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a user and return 201', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        accessToken: 'token', refreshToken: 'refresh', sessionId: 'sess-1',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', phone: null, role: 'CUSTOMER', avatar: null },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'StrongP@ss1',
            name: 'Test User',
          }),
        }),
        mockEnv
      );

      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('token');
    });

    it('should reject invalid email', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'invalid', password: 'Short1!' }),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });

    it('should reject short password', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'Sh1!' }),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return tokens', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        accessToken: 'token', refreshToken: 'refresh', sessionId: 'sess-1',
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', phone: null, role: 'CUSTOMER', avatar: null },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'StrongP@ss1' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it('should reject missing password', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: '' }),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      vi.mocked(authService.refreshToken).mockResolvedValue({
        accessToken: 'new-token', refreshToken: 'new-refresh',
      });

      const res = await app.fetch(
        new Request('http://localhost/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.data.accessToken).toBe('new-token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const res = await app.fetch(
        new Request('http://localhost/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const { getUserProfile } = await import('../../services/userService.js');
      vi.mocked(getUserProfile).mockResolvedValue({
        id: 'user-1', email: 'test@example.com', name: 'Test', phone: null,
        avatar: null, role: 'CUSTOMER', emailVerified: true,
        createdAt: new Date(), lastLoginAt: null,
        _count: { orders: 0, addresses: 1, wishlist: 0 },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/auth/me'),
        mockEnv
      );

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should handle Google OAuth', async () => {
      vi.mocked(authService.googleOAuth).mockResolvedValue({
        accessToken: 'google-token', refreshToken: 'google-refresh', sessionId: 'sess-1',
        user: { id: 'user-1', email: 'google@example.com', name: 'Google User', phone: null, role: 'CUSTOMER', avatar: null },
      });

      const res = await app.fetch(
        new Request('http://localhost/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'google-id-token' }),
        }),
        mockEnv
      );

      expect(res.status).toBe(200);
    });

    it('should reject missing idToken', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        mockEnv
      );

      expect(res.status >= 400).toBe(true);
    });
  });
});
