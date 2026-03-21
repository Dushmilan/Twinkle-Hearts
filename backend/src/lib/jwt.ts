// JWT utilities using RS256 (asymmetric keys)
// Private Commercial Project - Confidential

import { SignJWT, jwtVerify } from 'jose';
import { readFileSync } from 'fs';
import { logger } from './logger.js';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let privateKey: any | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let publicKey: any | null = null;

/**
 * Load JWT keys from files
 */
async function loadKeys() {
  if (privateKey && publicKey) return;

  try {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || './jwtRS256.key';
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './jwtRS256.key.pub';

    const privateKeyPEM = readFileSync(privateKeyPath, 'utf-8');
    const publicKeyPEM = readFileSync(publicKeyPath, 'utf-8');

    privateKey = await crypto.subtle.importKey(
      'pkcs8',
      Buffer.from(privateKeyPEM.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, ''), 'base64'),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    publicKey = await crypto.subtle.importKey(
      'spki',
      Buffer.from(publicKeyPEM.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, ''), 'base64'),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    logger.info('✅ JWT keys loaded successfully');
  } catch (error) {
    logger.warn('⚠️  JWT keys not found, generating temporary keys...');
    await generateKeyPair();
  }
}

/**
 * Generate a new key pair (for development only)
 */
export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  // In production, save these to files
  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;

  logger.info('🔑 Temporary JWT keys generated (development only)');
}

/**
 * Sign access token
 */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  await loadKeys();

  const jwt = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .setSubject(payload.userId)
    .sign(privateKey!);

  return jwt;
}

/**
 * Sign refresh token
 */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  await loadKeys();

  const jwt = await new SignJWT({
    userId: payload.userId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRES_IN || '30d')
    .setSubject(payload.userId)
    .sign(privateKey!);

  return jwt;
}

/**
 * Verify and decode token
 */
export async function verifyToken<T>(token: string): Promise<T | null> {
  await loadKeys();

  try {
    const { payload } = await jwtVerify(token, publicKey!);
    return payload as T;
  } catch (error) {
    logger.warn('Token verification failed:', error);
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch (error) {
    logger.error('Token decode error:', error);
    return null;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiry(token: string): Date | null {
  const decoded = decodeToken(token);
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
}
