// API utilities for file uploads
// Private Commercial Project - Confidential

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Upload product images to the server
 * @param files - Array of image files to upload
 * @param token - JWT access token
 * @returns Array of uploaded image URLs
 */
export const uploadProductImages = async (
  files: File[],
  token: string
): Promise<string[]> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}/admin/products/upload`, {
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

  const result = await response.json();
  return result.data.urls || [];
};

/**
 * Upload a single product image
 * @param file - Image file to upload
 * @param token - JWT access token
 * @returns Uploaded image URL
 */
export const uploadProductImage = async (
  file: File,
  token: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/admin/products/upload`, {
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

  const result = await response.json();
  return result.data.url;
};
