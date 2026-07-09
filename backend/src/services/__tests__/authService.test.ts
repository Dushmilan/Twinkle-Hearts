import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js');
vi.mock('../../utils/password.js');
vi.mock('../../lib/jwt.js');
vi.mock('../../lib/cache.js');

import { getPrisma } from '../../lib/prisma.js';
import * as passwordUtils from '../../utils/password.js';
import * as jwtLib from '../../lib/jwt.js';
import * as cacheLib from '../../lib/cache.js';
import { register, login, googleOAuth, refreshToken, logout, logoutAllSessions } from '../authService.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../middleware/errorHandler.js';

describe('authService', () => {
  let mockPrisma: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      session: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);

    mockEnv = {
      DB: {} as any,
      KV: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } as any,
      JWT_PRIVATE_KEY: 'test-private-key',
      JWT_PUBLIC_KEY: 'test-public-key',
      JWT_EXPIRES_IN: '7d',
      REFRESH_TOKEN_EXPIRES_IN: '30d',
    } as any;

    vi.mocked(passwordUtils.validatePasswordStrength).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(passwordUtils.hashPassword).mockResolvedValue('hashed-password');
    vi.mocked(passwordUtils.comparePassword).mockResolvedValue(true);
    vi.mocked(jwtLib.signAccessToken).mockResolvedValue('access-token');
    vi.mocked(jwtLib.signRefreshToken).mockResolvedValue('refresh-token');
    vi.mocked(jwtLib.verifyToken).mockResolvedValue({ userId: 'user-1', sessionId: 'session-1' });
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'StrongP@ss1',
      name: 'Test User',
      phone: '+919876543210',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+919876543210',
      role: 'CUSTOMER',
      avatar: null,
    };

    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      vi.mocked(cacheLib.cacheSet).mockResolvedValue(undefined);

      const result = await register(mockEnv, validInput);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.accessToken).toBe('access-token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            role: 'CUSTOMER',
          }),
        })
      );
    });

    it('should throw if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(register(mockEnv, validInput)).rejects.toThrow(ConflictError);
      await expect(register(mockEnv, validInput)).rejects.toThrow('Email already registered');
    });

    it('should throw if password is weak', async () => {
      vi.mocked(passwordUtils.validatePasswordStrength).mockReturnValue({
        valid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      await expect(register(mockEnv, validInput)).rejects.toThrow(BadRequestError);
    });

    it('should lowercase the email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      await register(mockEnv, { ...validInput, email: 'TEST@Example.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@example.com' }),
        })
      );
    });
  });

  describe('login', () => {
    const loginInput = { email: 'test@example.com', password: 'StrongP@ss1' };
    const mockFullUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+919876543210',
      role: 'CUSTOMER',
      avatar: null,
      passwordHash: 'hashed-password',
      isActive: true,
      lastLoginAt: null,
    };

    const mockUserResponse = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '+919876543210',
      role: 'CUSTOMER',
      avatar: null,
    };

    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockFullUser);
      mockPrisma.user.update.mockResolvedValue(mockFullUser);
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await login(mockEnv, loginInput);

      expect(result.accessToken).toBe('access-token');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        })
      );
    });

    it('should throw for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(login(mockEnv, loginInput)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw for deactivated account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockFullUser, isActive: false });

      await expect(login(mockEnv, loginInput)).rejects.toThrow(UnauthorizedError);
      await expect(login(mockEnv, loginInput)).rejects.toThrow('Account is deactivated');
    });

    it('should throw if user has no password hash', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockFullUser, passwordHash: null });

      await expect(login(mockEnv, loginInput)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw if password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockFullUser);
      vi.mocked(passwordUtils.comparePassword).mockResolvedValue(false);

      await expect(login(mockEnv, loginInput)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('googleOAuth', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should create a new user via Google OAuth', async () => {
      const mockGooglePayload = { email: 'google@example.com', name: 'Google User', picture: 'https://example.com/avatar.jpg' };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGooglePayload),
      } as any);

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'google@example.com',
        name: 'Google User',
        phone: null,
        role: 'CUSTOMER',
        avatar: 'https://example.com/avatar.jpg',
      });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await googleOAuth(mockEnv, 'valid-id-token');

      expect(result.user.email).toBe('google@example.com');
      expect(result.user.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should login existing Google OAuth user', async () => {
      const mockGooglePayload = { email: 'existing@example.com', name: 'Existing User', picture: 'https://example.com/pic.jpg' };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGooglePayload),
      } as any);

      const existingUser = {
        id: 'user-1', email: 'existing@example.com', name: 'Old Name',
        phone: null, role: 'CUSTOMER', avatar: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({ ...existingUser, name: 'Existing User', avatar: 'https://example.com/pic.jpg' });
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await googleOAuth(mockEnv, 'valid-id-token');

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw if Google token is invalid', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false } as any);

      await expect(googleOAuth(mockEnv, 'invalid-token')).rejects.toThrow(BadRequestError);
    });

    it('should throw if Google does not provide email', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'No Email' }),
      } as any);

      await expect(googleOAuth(mockEnv, 'token-no-email')).rejects.toThrow(BadRequestError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      vi.mocked(jwtLib.verifyToken).mockResolvedValue({ userId: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() + 86400000) });
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'test@example.com', role: 'CUSTOMER' });
      vi.mocked(jwtLib.signAccessToken).mockResolvedValue('new-access-token');
      vi.mocked(jwtLib.signRefreshToken).mockResolvedValue('new-refresh-token');

      const result = await refreshToken(mockEnv, 'valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw if refresh token is invalid', async () => {
      vi.mocked(jwtLib.verifyToken).mockResolvedValue(null);

      await expect(refreshToken(mockEnv, 'invalid-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw if session is expired', async () => {
      vi.mocked(jwtLib.verifyToken).mockResolvedValue({ userId: 'user-1', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({ userId: 'user-1', expiresAt: new Date(Date.now() - 86400000) });

      await expect(refreshToken(mockEnv, 'expired-session-token')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw if user not found', async () => {
      vi.mocked(jwtLib.verifyToken).mockResolvedValue({ userId: 'missing-user', sessionId: 'session-1' });
      mockPrisma.session.findUnique.mockResolvedValue({ userId: 'missing-user', expiresAt: new Date(Date.now() + 86400000) });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(refreshToken(mockEnv, 'valid-token')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should delete session and cache', async () => {
      mockPrisma.session.delete.mockResolvedValue({ id: 'session-1' });
      vi.mocked(cacheLib.cacheDelete).mockResolvedValue(undefined);

      await logout(mockEnv, 'session-1');

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
      expect(cacheLib.cacheDelete).toHaveBeenCalled();
    });

    it('should not throw if session delete fails', async () => {
      mockPrisma.session.delete.mockRejectedValue(new Error('Not found'));

      await expect(logout(mockEnv, 'session-1')).resolves.toBeUndefined();
    });
  });

  describe('logoutAllSessions', () => {
    it('should delete all sessions for user', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 });

      await logoutAllSessions(mockEnv, 'user-1');

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });
});
