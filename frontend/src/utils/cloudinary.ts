// Image Upload Service
// Private Commercial Project - Confidential
//
// This service handles image uploads via the backend API
// The backend uploads to Cloudinary using signed uploads for security

/**
 * Upload result from the backend
 */
export interface UploadResult {
  secure_url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
}

/**
 * Uploads images via the backend API
 * The backend handles Cloudinary signed uploads
 * 
 * @param files - Array of File objects to upload
 * @param token - Authentication token
 * @param options - Upload options
 * @returns Promise with array of upload results (URLs)
 */
export async function uploadImages(
  files: File[],
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: UploadOptions
): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const response = await fetch(`${apiUrl}/api/admin/products/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload images');
  }

  const data = await response.json();
  return data.data.urls || [];
}

/**
 * Uploads images with progress tracking
 * 
 * @param files - Array of File objects to upload
 * @param token - Authentication token
 * @param onProgress - Callback for progress updates (0-100)
 * @param options - Upload options
 * @returns Promise with array of upload results
 */
export async function uploadImagesWithProgress(
  files: File[],
  token: string,
  onProgress?: (progress: number) => void,
  options?: UploadOptions
): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  // For progress tracking, we upload files one by one
  const urls: string[] = [];
  let completed = 0;

  for (const file of files) {
    const url = await uploadSingleImage(file, token, options);
    urls.push(url);
    completed++;
    
    if (onProgress) {
      onProgress(Math.round((completed / files.length) * 100));
    }
  }

  return urls;
}

/**
 * Uploads a single image via the backend API
 */
async function uploadSingleImage(
  file: File,
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: UploadOptions
): Promise<string> {
  const formData = new FormData();
  formData.append('images', file);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const response = await fetch(`${apiUrl}/api/admin/products/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload image');
  }

  const data = await response.json();
  return data.data.urls[0];
}

/**
 * Extracts the public_id from a Cloudinary URL
 * Useful for deletion or transformation references
 */
export function extractPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  // Match pattern: /upload/v{version}/{public_id}.{format}
  // or: /upload/{public_id}.{format}
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

/**
 * Checks if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') ?? false;
}

export default {
  uploadImages,
  uploadImagesWithProgress,
  extractPublicId,
  isCloudinaryUrl,
};
