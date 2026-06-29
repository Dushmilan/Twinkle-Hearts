import { SignJWT, jwtVerify } from 'jose';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

async function loadKeys(privateKeyPEM: string, publicKeyPEM: string) {
  if (privateKey && publicKey) return;

  const privateKeyBase64 = privateKeyPEM
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const publicKeyBase64 = publicKeyPEM
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');

  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

  privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export async function signAccessToken(
  payload: { userId: string; email: string; role: string; sessionId: string },
  privateKeyPEM: string,
  expiresIn: string = '7d'
): Promise<string> {
  await loadKeys(privateKeyPEM, '');

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(payload.userId)
    .sign(privateKey!);
}

export async function signRefreshToken(
  payload: { userId: string; sessionId: string },
  privateKeyPEM: string,
  expiresIn: string = '30d'
): Promise<string> {
  await loadKeys(privateKeyPEM, '');

  return new SignJWT({
    userId: payload.userId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(payload.userId)
    .sign(privateKey!);
}

export async function verifyToken<T>(
  token: string,
  privateKeyPEM: string,
  publicKeyPEM: string
): Promise<T | null> {
  await loadKeys(privateKeyPEM, publicKeyPEM);

  try {
    const { payload } = await jwtVerify(token, publicKey!);
    return payload as T;
  } catch {
    return null;
  }
}
