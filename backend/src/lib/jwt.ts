// JWT utilities using RS256 (asymmetric keys)
// Private Commercial Project - Confidential

import { SignJWT, jwtVerify, exportJWK, importJWK, JWK } from 'jose';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

/**
 * Load JWT keys from files or generate and persist them if missing
 */
async function loadKeys() {
  if (privateKey && publicKey) return;

  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || './jwtRS256.key';
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './jwtRS256.key.pub';

  const keysProvided = existsSync(privateKeyPath) && existsSync(publicKeyPath);

  // In production, keys must be provided
  if (process.env.NODE_ENV === 'production' && !keysProvided) {
    throw new Error(
      'JWT key files must be provided via JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH in production'
    );
  }

  if (keysProvided) {
    try {
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

      logger.info('✅ JWT keys loaded from files');
      return;
    } catch (error) {
      logger.error('Failed to load JWT key files, generating new ones:', error);
    }
  }

  // Generate and persist keys
  await generateAndPersistKeys(privateKeyPath, publicKeyPath);
}

/**
 * Generate a new key pair and persist to disk
 */
async function generateAndPersistKeys(privateKeyPath: string, publicKeyPath: string) {
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

  // Export keys to JWK format
  const privateJWK = await exportJWK(keyPair.privateKey);
  const publicJWK = await exportJWK(keyPair.publicKey);

  // Convert JWK to PEM format for storage
  const privateKeyPEM = await josePKCS8FromJWK(privateJWK);
  const publicKeyPEM = await joseSPKIFromJWK(publicJWK);

  // Persist to disk
  writeFileSync(privateKeyPath, privateKeyPEM, 'utf-8');
  writeFileSync(publicKeyPath, publicKeyPEM, 'utf-8');

  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;

  if (process.env.NODE_ENV === 'production') {
    logger.error('⚠️  Auto-generated JWT keys persisted in production. This is not recommended.');
  } else {
    logger.warn('⚠️  Auto-generated JWT keys persisted to disk. Use env vars in production.');
  }
}

/**
 * Convert JWK to PKCS#8 PEM format (for private key)
 */
async function josePKCS8FromJWK(jwk: JWK): Promise<string> {
  const key = await importJWK(jwk, 'RS256');
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', key as CryptoKey);
  const base64 = Buffer.from(pkcs8).toString('base64');
  return `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

/**
 * Convert JWK to SPKI PEM format (for public key)
 */
async function joseSPKIFromJWK(jwk: JWK): Promise<string> {
  const key = await importJWK(jwk, 'RS256');
  const spki = await crypto.subtle.exportKey('spki', key as CryptoKey);
  const base64 = Buffer.from(spki).toString('base64');
  return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

/**
 * Generate a new key pair (for development only)
 * @deprecated Use generateAndPersistKeys instead
 */
export async function generateKeyPair() {
  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || './jwtRS256.key';
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './jwtRS256.key.pub';
  await generateAndPersistKeys(privateKeyPath, publicKeyPath);
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
