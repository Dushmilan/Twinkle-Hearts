// Image Transformation Utilities
// Private Commercial Project - Confidential
//
// Helper functions for Cloudinary image transformations
// Provides responsive, optimized image URLs

/**
 * Image transformation options
 */
export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'pad' | 'crop';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
  radius?: number | 'max';
  blur?: number;
  sharpen?: number;
  saturation?: number;
  brightness?: number;
}

/**
 * Preset configurations for common use cases
 */
export const ImagePresets = {
  // Product card thumbnail
  thumbnail: {
    width: 300,
    height: 300,
    crop: 'fill' as const,
    quality: 'auto:good' as const,
    format: 'auto' as const,
  },
  // Product detail page
  detail: {
    width: 800,
    quality: 'auto:best' as const,
    format: 'auto' as const,
  },
  // Hero/banner image
  hero: {
    width: 1200,
    height: 600,
    crop: 'fill' as const,
    quality: 'auto:best' as const,
    format: 'auto' as const,
  },
  // Small icon/thumbnail
  icon: {
    width: 64,
    height: 64,
    crop: 'fill' as const,
    quality: 'auto:low' as const,
    format: 'auto' as const,
  },
  // Low quality placeholder for lazy loading
  placeholder: {
    width: 20,
    quality: 'auto:low' as const,
    format: 'auto' as const,
    blur: 100,
  },
} as const;

/**
 * Builds a Cloudinary transformation string from options
 */
function buildTransformation(options: TransformOptions): string {
  const transforms: string[] = [];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.gravity) transforms.push(`g_${options.gravity}`);
  if (options.quality !== undefined) {
    const q = typeof options.quality === 'number' ? options.quality : options.quality;
    transforms.push(`q_${q}`);
  }
  if (options.format) transforms.push(`f_${options.format}`);
  if (options.radius !== undefined) transforms.push(`r_${options.radius}`);
  if (options.blur) transforms.push(`e_blur:${options.blur}`);
  if (options.sharpen) transforms.push(`e_sharpen:${options.sharpen}`);
  if (options.saturation !== undefined) transforms.push(`e_saturation:${options.saturation}`);
  if (options.brightness !== undefined) transforms.push(`e_brightness:${options.brightness}`);

  return transforms.join(',');
}

/**
 * Checks if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Transforms a Cloudinary URL with specified options
 * Non-Cloudinary URLs are returned unchanged
 * 
 * @param url - Original image URL
 * @param options - Transformation options
 * @returns Transformed URL or original URL if not Cloudinary
 */
export function getImageUrl(url: string, options: TransformOptions = {}): string {
  if (!url) return url;
  if (!isCloudinaryUrl(url)) return url;

  const transformation = buildTransformation(options);
  if (!transformation) return url;

  // Insert transformation after '/upload/'
  // Handle both URLs with version (v1234567) and without
  return url.replace(/\/upload\//, `/upload/${transformation}/`);
}

/**
 * Gets a thumbnail URL for product cards
 */
export function getThumbnail(url: string, size: number = 300): string {
  return getImageUrl(url, {
    ...ImagePresets.thumbnail,
    width: size,
    height: size,
  });
}

/**
 * Gets a detail view URL for product pages
 */
export function getDetailImage(url: string, maxWidth: number = 800): string {
  return getImageUrl(url, {
    ...ImagePresets.detail,
    width: maxWidth,
  });
}

/**
 * Gets a hero/banner image URL
 */
export function getHeroImage(url: string): string {
  return getImageUrl(url, ImagePresets.hero);
}

/**
 * Gets a small icon URL
 */
export function getIcon(url: string, size: number = 64): string {
  return getImageUrl(url, {
    ...ImagePresets.icon,
    width: size,
    height: size,
  });
}

/**
 * Gets a low-quality placeholder URL for lazy loading
 * Use as src for blur-up effect
 */
export function getPlaceholder(url: string): string {
  return getImageUrl(url, ImagePresets.placeholder);
}

/**
 * Generates responsive image srcset for different screen sizes
 * Returns array of [url, width] pairs
 */
export function getResponsiveSizes(
  url: string,
  sizes: number[] = [320, 480, 640, 800, 1024, 1280]
): Array<{ url: string; width: number }> {
  if (!isCloudinaryUrl(url)) {
    return sizes.map((width) => ({ url, width }));
  }

  return sizes.map((width) => ({
    url: getImageUrl(url, { width, quality: 'auto', format: 'auto' }),
    width,
  }));
}

/**
 * Generates srcset attribute value for img tag
 */
export function getSrcSet(url: string, sizes?: number[]): string {
  const responsiveSizes = getResponsiveSizes(url, sizes);
  return responsiveSizes.map(({ url: u, width }) => `${u} ${width}w`).join(', ');
}

/**
 * Gets optimized image with WebP format for modern browsers
 */
export function getWebP(url: string, options: TransformOptions = {}): string {
  return getImageUrl(url, { ...options, format: 'webp' });
}

/**
 * Gets optimized image with AVIF format for supported browsers
 */
export function getAVIF(url: string, options: TransformOptions = {}): string {
  return getImageUrl(url, { ...options, format: 'avif' });
}

/**
 * Creates a blurred background image URL
 * Useful for hero sections with overlay text
 */
export function getBlurredBackground(url: string, blurAmount: number = 100): string {
  return getImageUrl(url, {
    width: 1920,
    quality: 'auto:good',
    format: 'auto',
    blur: blurAmount,
  });
}

/**
 * Gets a circular cropped image (avatar style)
 */
export function getAvatar(url: string, size: number = 150): string {
  return getImageUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    radius: 'max',
    quality: 'auto:good',
    format: 'auto',
  });
}

export default {
  getImageUrl,
  getThumbnail,
  getDetailImage,
  getHeroImage,
  getIcon,
  getPlaceholder,
  getResponsiveSizes,
  getSrcSet,
  getWebP,
  getAVIF,
  getBlurredBackground,
  getAvatar,
  isCloudinaryUrl,
  ImagePresets,
};
