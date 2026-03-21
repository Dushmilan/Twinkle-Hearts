/**
 * Auth Test Helpers
 * Utilities for creating authenticated test users and tokens
 */

import { SignJWT } from 'jose';
import { testPrisma } from './db.js';
import { createUser } from './factories.js';

const TEST_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only'
);

/**
 * Generate a test JWT token for a given user ID
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
    expiresIn = '1h',
  } = options;

  return new SignJWT({
    userId,
    email,
    role,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(TEST_SECRET);
}

/**
 * Create an authenticated test user with JWT token
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

  const token = await generateTestToken(user.id, {
    email: user.email,
    role: user.role,
  });

  return { user, token };
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

  const token = await generateTestToken(user.id, {
    email: user.email,
    role: 'ADMIN',
  });

  return { user, token };
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
