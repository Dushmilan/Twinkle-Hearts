// Multer middleware for file uploads
// Private Commercial Project - Confidential

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import { BadRequestError } from './errorHandler.js';

// Configure memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      )
    );
  }
};

// Multer configuration
const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE || '5') || 5;
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // Max file size from env var (default: 5MB)
    files: 10, // Max 10 files per request
  },
});

/**
 * Middleware for single product image upload
 * Usage: upload.single('image')
 */
export const uploadProductImage = upload.single('image');

/**
 * Middleware for multiple product images upload
 * Usage: uploadProductImages.array('images', 5)
 * @param fieldName - Form field name for images
 * @param maxCount - Maximum number of images (default: 5)
 */
export const uploadProductImages = (fieldName = 'images', maxCount = 5) =>
  upload.array(fieldName, maxCount);

/**
 * Error handler for multer errors
 */
export const handleUploadError = (
  err: any,
  _req: Request,
  res: any,
  next: any
) => {
  const maxFileSize = process.env.MAX_FILE_SIZE || '5MB';
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new BadRequestError(`File too large. Maximum size is ${maxFileSize}.`)
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(
        new BadRequestError('Too many files. Maximum 10 files allowed.')
      );
    }
    return next(new BadRequestError(`Upload error: ${err.message}`));
  }

  if (err) {
    return next(err);
  }

  next();
};
