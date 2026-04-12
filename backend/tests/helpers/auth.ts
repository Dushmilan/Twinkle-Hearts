/**
 * Auth Test Helpers
 * Utilities for creating authenticated test users and tokens
 */

import { signAccessToken, signRefreshToken } from '../../src/lib/jwt.js';
import { testPrisma } from './db.js';
import { createUser } from './factories.js';

/**
 * Generate a test JWT token for a given user ID using the real RS256 signing
 */
export async function generateTestToken(
  userId: string,
  options: {
    email?: string;
    role?: string;
    sessionId?: string;
    expiresIn?: string;
  } = {}
): Promise<string> {
  const {
    email = 'test@example.com',
    role = 'CUSTOMER',
    sessionId = 'test-session-' + Date.now(),
  } = options;

  // Set custom expiry via env for the test
  const originalExpiry = process.env.JWT_EXPIRES_IN;
  process.env.JWT_EXPIRES_IN = options.expiresIn || '1h';

  const token = await signAccessToken({
    userId,
    email,
    role,
    sessionId,
  });

  process.env.JWT_EXPIRES_IN = originalExpiry;

  return token;
}

/**
 * Generate a test refresh token using the real RS256 signing
 */
export async function generateTestRefreshToken(
  userId: string,
  options: {
    sessionId?: string;
  } = {}
): Promise<string> {
  const {
    sessionId = 'test-session-' + Date.now(),
  } = options;

  const originalExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN;
  process.env.REFRESH_TOKEN_EXPIRES_IN = '1h';

  const token = await signRefreshToken({
    userId,
    sessionId,
  });

  process.env.REFRESH_TOKEN_EXPIRES_IN = originalExpiry;

  return token;
}

/**
 * Create an authenticated test user with JWT token
 * Uses real RS256 JWT signing for test compatibility
 */
export async function createAuthenticatedUser(
  overrides: {
    email?: string;
    role?: string;
    name?: string;
    phone?: string;
  } = {}
) {
  const user = await createUser({
    email: overrides.email || `auth-test-${Date.now()}@example.com`,
    role: (overrides.role as any) || 'CUSTOMER',
    name: overrides.name || 'Test Auth User',
    phone: overrides.phone || '+919876543210',
  });

  const sessionId = `test-session-${user.id}`;

  // Create a session in the database
  await testPrisma.session.create({
    data: {
      userId: user.id,
      tokenHash: `test-hash-${sessionId}`,
      refreshToken: `test-refresh-${sessionId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const token = await generateTestToken(user.id, {
    email: user.email,
    role: user.role,
    sessionId,
  });

  return { user, token, sessionId };
}

/**
 * Create an admin test user with JWT token
 */
export async function createAdminUser(overrides: { email?: string; name?: string } = {}) {
  const user = await createUser({
    email: overrides.email || `admin-test-${Date.now()}@example.com`,
    role: 'ADMIN',
    name: overrides.name || 'Test Admin',
  });

  const sessionId = `test-session-admin-${user.id}`;

  await testPrisma.session.create({
    data: {
      userId: user.id,
      tokenHash: `test-hash-${sessionId}`,
      refreshToken: `test-refresh-${sessionId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const token = await generateTestToken(user.id, {
    email: user.email,
    role: 'ADMIN',
    sessionId,
  });

  return { user, token, sessionId };
}

/**
 * Create auth header for requests
 */
export function authHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create a session in the database for a user
 */
export async function createSession(userId: string, overrides: {
  expiresAt?: Date;
  tokenHash?: string;
  refreshToken?: string;
} = {}) {
  const expiresAt = overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tokenHash = overrides.tokenHash || `test-hash-${Date.now()}`;
  const refreshToken = overrides.refreshToken || `test-refresh-${Date.now()}`;

  const session = await testPrisma.session.create({
    data: {
      userId,
      tokenHash,
      refreshToken,
      expiresAt,
    },
  });

  return session;
}

/**
 * Clean up all sessions for a user
 */
export async function cleanupSessions(userId: string) {
  await testPrisma.session.deleteMany({
    where: { userId },
  });
}
