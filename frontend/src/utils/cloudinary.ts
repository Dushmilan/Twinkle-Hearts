// Cloudinary Upload Service
// Private Commercial Project - Confidential
//
// This service handles direct-to-Cloudinary uploads from the frontend
// using unsigned upload presets for secure, serverless image uploads.

/**
 * Uploads a single image to Cloudinary
 * @param file - The File object to upload
 * @param options - Upload options
 * @returns Promise with the secure URL and public_id
 */
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Validates that Cloudinary configuration is available
 */
function validateConfig(): void {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment.'
    );
  }
}

/**
 * Uploads a single file to Cloudinary
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  validateConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Set folder for organization
  if (options.folder) {
    formData.append('folder', options.folder);
  } else {
    formData.append('folder', 'twinkle-hearts/products');
  }

  // Add tags for organization
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  // Add context metadata
  if (options.context) {
    const contextStr = Object.entries(options.context)
      .map(([key, value]) => `${key}=${value}`)
      .join('|');
    formData.append('context', contextStr);
  }

  // Auto-tag with original filename for reference
  formData.append('context', `original_filename=${file.name}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw new Error(error.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  };
}

/**
 * Uploads multiple images to Cloudinary concurrently
 * @param files - Array of File objects to upload
 * @param options - Upload options applied to all files
 * @returns Promise with array of upload results
 */
export async function uploadImages(
  files: File[],
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  if (!files || files.length === 0) {
    return [];
  }

  // Upload all files concurrently
  const uploadPromises = files.map((file) => uploadImage(file, options));
  
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // If any upload fails, throw the error
    throw error;
  }
}

/**
 * Uploads images with progress tracking
 * @param files - Array of File objects to upload
 * @param onProgress - Callback for progress updates (0-100)
 * @param options - Upload options
 * @returns Promise with array of upload results
 */
export async function uploadImagesWithProgress(
  files: File[],
  onProgress?: (progress: number) => void,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  if (!files || files.length === 0) {
    return [];
  }

  const results: CloudinaryUploadResult[] = [];
  let completed = 0;

  for (const file of files) {
    const result = await uploadImage(file, options);
    results.push(result);
    completed++;
    
    if (onProgress) {
      onProgress(Math.round((completed / files.length) * 100));
    }
  }

  return results;
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
  uploadImage,
  uploadImages,
  uploadImagesWithProgress,
  extractPublicId,
  isCloudinaryUrl,
};
