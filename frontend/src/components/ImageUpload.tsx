// Image Upload Component for Product Images
// Private Commercial Project - Confidential
//
// This component handles local file selection with preview
// Actual upload to Cloudinary happens when the parent form is submitted

import { useState, useRef, useEffect, useCallback } from 'react';
import toastService from '../utils/toast';

interface ImageUploadProps {
  /** Existing image URLs (for edit mode) */
  initialImages?: string[];
  /** Callback when files change - provides File objects for parent to upload */
  onFilesChange: (files: File[]) => void;
  /** Callback when existing images are removed */
  onExistingImagesChange?: (images: string[]) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Whether upload is in progress (controlled by parent) */
  isUploading?: boolean;
  /** Disable the component */
  disabled?: boolean;
}

interface ImagePreview {
  id: string;
  url: string;
  file: File;
  isNew: true;
}

interface ExistingImage {
  id: string;
  url: string;
  isNew: false;
}

type PreviewItem = ImagePreview | ExistingImage;

export default function ImageUpload({
  initialImages = [],
  onFilesChange,
  onExistingImagesChange,
  maxImages = 5,
  multiple = true,
  isUploading = false,
  disabled = false,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with existing images
  useEffect(() => {
    const existingPreviews: ExistingImage[] = initialImages.map((url, index) => ({
      id: `existing-${index}-${url}`,
      url,
      isNew: false,
    }));
    setPreviews(existingPreviews);
  }, [initialImages]);

  // Notify parent when files change
  useEffect(() => {
    onFilesChange(newFiles);
  }, [newFiles, onFilesChange]);

  // Generate unique ID for previews
  const generateId = useCallback(() => {
    return `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    // Validate file count
    const currentCount = previews.length;
    if (multiple && currentCount + selectedFiles.length > maxImages) {
      toastService.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file types and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        toastService.error(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and WebP allowed.`);
        return;
      }
      if (file.size > maxSize) {
        toastService.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }
    }

    // Create local previews using blob URLs
    const newPreviews: ImagePreview[] = selectedFiles.map((file) => ({
      id: generateId(),
      url: URL.createObjectURL(file),
      file,
      isNew: true,
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
    setNewFiles((prev) => [...prev, ...selectedFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    const item = previews.find((p) => p.id === id);
    
    if (item) {
      // Revoke blob URL if it's a new file
      if (item.isNew) {
        URL.revokeObjectURL(item.url);
        setNewFiles((prev) => prev.filter((f) => f !== (item as ImagePreview).file));
      } else if (onExistingImagesChange) {
        // Notify parent about removed existing image
        const remainingExisting = previews
          .filter((p) => p.id !== id && !p.isNew)
          .map((p) => p.url);
        onExistingImagesChange(remainingExisting);
      }
    }

    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      const [removed] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, removed);
      return newPreviews;
    });

    // Also reorder files array to match
    setNewFiles((prev) => {
      // Get the indices of new files in the previews array
      const newFileIndices = previews
        .map((p, i) => (p.isNew ? i : -1))
        .filter((i) => i !== -1);
      
      // Find the from and to positions in the new files array
      const fromFileIndex = newFileIndices.indexOf(fromIndex);
      const toFileIndex = newFileIndices.indexOf(toIndex);
      
      if (fromFileIndex !== -1 && toFileIndex !== -1) {
        const newFilesCopy = [...prev];
        const [removed] = newFilesCopy.splice(fromFileIndex, 1);
        newFilesCopy.splice(toFileIndex, 0, removed);
        return newFilesCopy;
      }
      return prev;
    });
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.isNew) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const canAddMore = previews.length < maxImages && !disabled && !isUploading;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Upload up to {maxImages} images (JPEG, PNG, GIF, WebP - Max 5MB each).
          Images will be uploaded when you submit the form.
        </p>

        <div
          onClick={() => canAddMore && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition
            ${disabled || isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
              : previews.length >= maxImages
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-ruby-500 hover:bg-ruby-50 cursor-pointer'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            multiple={multiple}
            disabled={!canAddMore}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ruby-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading images...</p>
            </div>
          ) : previews.length >= maxImages ? (
            <p className="text-sm text-gray-500">Maximum {maxImages} images reached</p>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Click to upload {multiple ? 'images' : 'image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or drag and drop files here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={preview.id} className="relative group aspect-square">
              <img
                src={preview.url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.png';
                }}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(preview.id)}
                  className="bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  title="Remove image"
                  disabled={disabled || isUploading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index - 1)}
                    className="bg-white text-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
                    title="Move left"
                    disabled={disabled || isUploading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {index < previews.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index + 1)}
                    className="bg-white text-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
                    title="Move right"
                    disabled={disabled || isUploading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* First image badge */}
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-ruby-600 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </span>
              )}

              {/* New image indicator */}
              {preview.isNew && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {previews.length > 0 && previews.some((p) => p.isNew) && (
        <p className="text-sm text-gray-500 italic">
          * New images will be uploaded when you submit the form
        </p>
      )}
    </div>
  );
}
