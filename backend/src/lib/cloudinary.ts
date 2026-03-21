// Cloudinary Service for Backend
// Private Commercial Project - Confidential
//
// Handles server-side image uploads to Cloudinary using signed uploads
// This provides better security and control over image uploads

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { BadRequestError } from '../middleware/errorHandler.js';

// Configure Cloudinary (called after dotenv loads in server.ts)
export function initCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  original_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  tags?: string[];
  context?: Record<string, string>;
  transformation?: object;
}

/**
 * Validates that Cloudinary configuration is available
 */
function validateConfig(): void {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.'
    );
  }
}

/**
 * Uploads a single image buffer to Cloudinary
 * @param buffer - Image buffer from multer
 * @param options - Upload options
 * @returns Upload result with URLs and metadata
 */
export async function uploadImage(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  validateConfig();

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder || 'twinkle-hearts/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    if (options.public_id) {
      uploadOptions.public_id = options.public_id;
    }

    if (options.tags && options.tags.length > 0) {
      uploadOptions.tags = options.tags;
    }

    if (options.context) {
      uploadOptions.context = options.context;
    }

    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(new BadRequestError(`Image upload failed: ${error?.message || 'Unknown error'}`));
          return;
        }

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          original_url: result.url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resource_type: result.resource_type,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Uploads multiple images to Cloudinary
 * @param buffers - Array of image buffers
 * @param options - Upload options applied to all images
 * @returns Array of upload results
 */
export async function uploadImages(
  buffers: Buffer[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  if (!buffers || buffers.length === 0) {
    return [];
  }

  const uploadPromises = buffers.map((buffer) => uploadImage(buffer, options));
  return Promise.all(uploadPromises);
}

/**
 * Deletes an image from Cloudinary by public_id
 * @param publicId - The public_id of the image to delete
 * @returns True if deletion was successful
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  validateConfig();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

/**
 * Deletes multiple images from Cloudinary
 * @param publicIds - Array of public_ids to delete
 * @returns Object with deleted and failed arrays
 */
export async function deleteImages(
  publicIds: string[]
): Promise<{ deleted: string[]; failed: string[] }> {
  if (!publicIds || publicIds.length === 0) {
    return { deleted: [], failed: [] };
  }

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const publicId of publicIds) {
    const success = await deleteImage(publicId);
    if (success) {
      deleted.push(publicId);
    } else {
      failed.push(publicId);
    }
  }

  return { deleted, failed };
}

/**
 * Extracts the public_id from a Cloudinary URL
 * @param url - Cloudinary URL
 * @returns public_id or null if not a valid Cloudinary URL
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

/**
 * Generates a transformed URL for an image
 * @param publicIdOrUrl - public_id or full URL
 * @param transformation - Cloudinary transformation options
 * @returns Transformed URL
 */
export function getTransformedUrl(
  publicIdOrUrl: string,
  transformation: object
): string {
  const publicId = isCloudinaryUrl(publicIdOrUrl) 
    ? extractPublicId(publicIdOrUrl) 
    : publicIdOrUrl;

  if (!publicId) {
    return publicIdOrUrl;
  }

  return cloudinary.url(publicId, transformation);
}

/**
 * Gets a thumbnail URL for an image
 */
export function getThumbnailUrl(url: string, size: number = 300): string {
  return getTransformedUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  });
}

/**
 * Gets a full-size URL for an image
 */
export function getDetailUrl(url: string, maxWidth: number = 800): string {
  return getTransformedUrl(url, {
    width: maxWidth,
    quality: 'auto:best',
    fetch_format: 'auto',
  });
}

export default {
  uploadImage,
  uploadImages,
  deleteImage,
  deleteImages,
  extractPublicId,
  isCloudinaryUrl,
  getTransformedUrl,
  getThumbnailUrl,
  getDetailUrl,
};
