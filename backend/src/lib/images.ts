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

export async function uploadToCloudinary(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  buffer: ArrayBuffer,
  folder: string = 'twinkle-hearts/products'
): Promise<{ secure_url: string; public_id: string }> {
  const formData = new FormData();
  const blob = new Blob([buffer]);
  formData.append('file', blob);
  formData.append('folder', folder);

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateCloudinarySignature(timestamp, apiSecret, folder);

  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new ImageUploadError(`Cloudinary upload failed: ${error}`, 502);
  }

  const result: any = await response.json();
  return { secure_url: result.secure_url, public_id: result.public_id };
}

async function generateCloudinarySignature(
  timestamp: number,
  apiSecret: string,
  folder: string
): Promise<string> {
  const str = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function deleteFromCloudinary(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  publicId: string
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);
  const str = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  const signature = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) return false;
  const result: any = await response.json();
  return result.result === 'ok';
}
