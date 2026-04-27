import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';
import { cacheSet, cacheDelete, cacheGet, cacheWrap, CACHE_TTL, CacheKeys } from '../lib/cache.js';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    avatar: string | null;
  };
  sessionId: string;
}

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  avatar: string | null;
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  // Validate password strength
  const passwordValidation = validatePasswordStrength(input.password);
  if (!passwordValidation.valid) {
    throw new BadRequestError(passwordValidation.errors.join(', '));
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
    },
  });

  logger.info(`User registered: ${user.email}`);

  // Create session and tokens
  return createSession(user);
}

/**
 * Login with email and password
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  if (!user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info(`User logged in: ${user.email}`);

  // Create session and tokens
  return createSession(user);
}

/**
 * Login/Signup with Google OAuth - Requires ID token verification
 */
export async function googleOAuth(idToken: string): Promise<AuthResponse> {
  // Verify Google ID token
  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    throw new BadRequestError('Invalid Google ID token');
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new BadRequestError('Invalid Google ID token payload');
  }

  // Validate required fields
  if (!payload.email) {
    throw new BadRequestError('Email not provided by Google');
  }

  const email = payload.email;
  const name = payload.name || '';
  const avatar = payload.picture || '';

  // Verify the token is for this app (audience check)
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new BadRequestError('Invalid token audience');
  }

  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
    },
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        avatar,
        role: 'CUSTOMER',
        emailVerified: true, // Google verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
      },
    });

    logger.info(`Google OAuth user created: ${user.email}`);
  } else {
    // Update existing user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        avatar: avatar || user.avatar,
        lastLoginAt: new Date(),
      },
    });

    logger.info(`Google OAuth user logged in: ${user.email}`);
  }

  return createSession(user);
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  const payload = await verifyToken<any>(refreshToken);
  if (!payload || payload.userId === undefined) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check session exists
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Session expired');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, role: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Generate new tokens
  const newAccessToken = await signAccessToken({
    userId: payload.userId,
    email: user.email,
    role: user.role,
    sessionId: payload.sessionId,
  });

  const newRefreshToken = await signRefreshToken({
    userId: payload.userId,
    sessionId: payload.sessionId,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout (invalidate session)
 */
export async function logout(sessionId: string): Promise<void> {
  // Delete from database
  await prisma.session.delete({
    where: { id: sessionId },
  }).catch(() => {
    // Session might not exist
  });

  // Delete from cache
  await cacheDelete(CacheKeys.session(sessionId));

  logger.info(`Session invalidated: ${sessionId}`);
}

/**
 * Logout all sessions for a user
 */
export async function logoutAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });

  logger.info(`All sessions invalidated for user: ${userId}`);
}

/**
 * Create session and generate tokens
 */
async function createSession(user: SessionUser): Promise<AuthResponse> {
  const sessionId = crypto.randomUUID();

  // Create session record
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: crypto.createHash('sha256').update(sessionId).digest('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Generate tokens
  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId,
  });

  const refreshToken = await signRefreshToken({
    userId: user.id,
    sessionId,
  });

  // Cache session
  await cacheSet(
    CacheKeys.session(sessionId),
    { userId: user.id },
    CACHE_TTL.SESSION
  );

  return {
    accessToken,
    refreshToken,
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
    },
  };
}
