// Image Upload Component for Product Images
// Private Commercial Project - Confidential

import { useState, useRef } from 'react';
import toastService from '../utils/toast';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  token: string;
  maxImages?: number;
  multiple?: boolean;
}

export default function ImageUpload({
  images,
  onChange,
  token,
  maxImages = 5,
  multiple = true,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    // Validate file count
    if (multiple && images.length + selectedFiles.length > maxImages) {
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

    // Create local previews
    const localPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...localPreviews]);

    // Upload files
    setIsUploading(true);
    const loadingToast = toastService.loading('Uploading images...');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:3001/api/admin/products/upload', {
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
      const uploadedUrls = result.data.urls || [];

      onChange([...images, ...uploadedUrls]);
      toastService.dismiss(loadingToast);
      toastService.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      toastService.dismiss(loadingToast);
      toastService.error('Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setPreviews([]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Upload up to {maxImages} images (JPEG, PNG, GIF, WebP - Max 5MB each)
        </p>
        
        <div
          onClick={() => !isUploading && images.length < maxImages && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
            ${isUploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : images.length >= maxImages
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-pink-500 hover:bg-pink-50'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            multiple={multiple}
            disabled={isUploading || images.length >= maxImages}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : images.length >= maxImages ? (
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
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group aspect-square">
              <img
                src={imageUrl}
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
                  onClick={() => handleRemoveImage(index)}
                  className="bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index - 1)}
                    className="bg-white text-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                    title="Move left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index + 1)}
                    className="bg-white text-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                    title="Move right"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* First image badge */}
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploading Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={`preview-${index}`} className="relative aspect-square opacity-60">
              <img
                src={preview}
                alt={`Uploading ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
