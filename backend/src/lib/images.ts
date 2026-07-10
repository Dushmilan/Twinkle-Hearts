const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export class ImageUploadError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ImageUploadError';
  }
}

export function validateImage(file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
  }
}

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const id = crypto.randomUUID();
  return `products/${id}.${ext}`;
}

export async function uploadToR2(
  r2: R2Bucket,
  file: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }
): Promise<string> {
  validateImage(file);
  const key = generateFileName(file.name);
  const buffer = await file.arrayBuffer();
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });
  return key;
}

export async function uploadToR2FromBuffer(
  r2: R2Bucket,
  buffer: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = generateFileName(fileName);
  await r2.put(key, buffer, {
    httpMetadata: { contentType },
    customMetadata: { originalName: fileName },
  });
  return key;
}

export async function deleteFromR2(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}

export async function deleteMultipleFromR2(r2: R2Bucket, keys: string[]): Promise<void> {
  await r2.delete(keys);
}

export function getPublicUrl(key: string): string {
  return `/images/${key}`;
}

export function extractR2Key(url: string): string | null {
  const match = url.match(/\/images\/(.+)/);
  return match ? match[1] : null;
}

export function isR2Url(url: string): boolean {
  return url?.startsWith('/images/') ?? false;
}
