import { getPrismaRepository } from '../lib/prisma.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';
import { CacheKeys, getCacheRepository } from '../lib/cache/index.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import type { Env } from '../types.js';

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

async function createSession(env: Env, user: { id: string; email: string; name: string | null; phone: string | null; role: string; avatar: string | null }): Promise<AuthResponse> {
  const prisma = getPrismaRepository(env.DB);
  const sessionId = crypto.randomUUID();

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId)).then(h => {
        return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
      }),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = await signAccessToken(
    { userId: user.id, email: user.email, role: user.role, sessionId },
    env.JWT_PRIVATE_KEY,
    env.JWT_EXPIRES_IN || '7d'
  );

  const refreshToken = await signRefreshToken(
    { userId: user.id, sessionId },
    env.JWT_PRIVATE_KEY,
    env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  );

  await getCacheRepository(env.KV).setSession(sessionId, { userId: user.id });

  return { accessToken, refreshToken, sessionId, user };
}

export async function register(env: Env, input: RegisterInput): Promise<AuthResponse> {
  const passwordValidation = validatePasswordStrength(input.password);
  if (!passwordValidation.valid) {
    throw new BadRequestError(passwordValidation.errors.join(', '));
  }

  const prisma = getPrismaRepository(env.DB);

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

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

  console.info(`User registered: ${user.email}`);
  return createSession(env, user);
}

export async function login(env: Env, input: LoginInput): Promise<AuthResponse> {
  const prisma = getPrismaRepository(env.DB);

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  console.info(`User logged in: ${user.email}`);

  return createSession(env, {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
  });
}

export async function googleOAuth(env: Env, idToken: string): Promise<AuthResponse> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) {
    throw new BadRequestError('Invalid Google ID token');
  }

  const payload: any = await response.json();

  if (!payload.email) {
    throw new BadRequestError('Email not provided by Google');
  }

  const email = payload.email;
  const name = payload.name || '';
  const avatar = payload.picture || '';

  const prisma = getPrismaRepository(env.DB);
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        avatar,
        role: 'CUSTOMER',
        emailVerified: true,
      },
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true },
    });
    console.info(`Google OAuth user created: ${user.email}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name || user.name, avatar: avatar || user.avatar, lastLoginAt: new Date() },
    });
    console.info(`Google OAuth user logged in: ${user.email}`);
  }

  return createSession(env, user);
}

export async function refreshToken(env: Env, token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyToken<any>(token, env.JWT_PRIVATE_KEY, env.JWT_PUBLIC_KEY);
  if (!payload || !payload.userId) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const prisma = getPrismaRepository(env.DB);
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { userId: true, expiresAt: true },
  });

  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new UnauthorizedError('Session expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, role: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const newAccessToken = await signAccessToken(
    { userId: payload.userId, email: user.email, role: user.role, sessionId: payload.sessionId },
    env.JWT_PRIVATE_KEY,
    env.JWT_EXPIRES_IN || '7d'
  );

  const newRefreshToken = await signRefreshToken(
    { userId: payload.userId, sessionId: payload.sessionId },
    env.JWT_PRIVATE_KEY,
    env.REFRESH_TOKEN_EXPIRES_IN || '30d'
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(env: Env, sessionId: string): Promise<void> {
  const prisma = getPrismaRepository(env.DB);
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  await getCacheRepository(env.KV).invalidateSession(sessionId);
  console.info(`Session invalidated: ${sessionId}`);
}

export async function logoutAllSessions(env: Env, userId: string): Promise<void> {
  const prisma = getPrismaRepository(env.DB);
  await prisma.session.deleteMany({ where: { userId } });
  console.info(`All sessions invalidated for user: ${userId}`);
}
