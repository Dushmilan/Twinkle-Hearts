# Cloudinary Integration Setup Guide

This guide explains how to set up Cloudinary for image storage in the Twinkle-Hearts e-commerce platform.

## Overview

The application uses **Cloudinary** for cloud-based image storage and delivery. Images are uploaded directly from the frontend to Cloudinary using **unsigned uploads**, which provides:

- **No orphaned files**: Images are only uploaded when the product form is submitted
- **CDN delivery**: Fast image loading worldwide
- **Automatic optimization**: WebP/AVIF conversion, compression
- **Responsive images**: Different sizes for different viewports

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Cloudinary    │     │   Backend       │
│                 │     │                 │     │                 │
│ 1. Select files │     │                 │     │                 │
│ 2. Local preview│     │                 │     │                 │
│ 3. Submit form  │────▶│ 4. Store images │     │                 │
│                 │     │ 5. Return URLs  │     │                 │
│                 │◀────│                 │     │                 │
│                 │     │                 │     │                 │
│ 6. POST product │────────────────────────────▶│ 7. Save product │
│    with URLs    │     │                 │     │    with URLs    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Setup Instructions

### Step 1: Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. The free tier includes:
   - 25 GB storage
   - 25 GB monthly bandwidth
   - 300,000 transformations

### Step 2: Get Your Cloud Name

1. Log in to your Cloudinary dashboard
2. Copy your **Cloud Name** from the dashboard
3. This will be used as `VITE_CLOUDINARY_CLOUD_NAME`

### Step 3: Create an Unsigned Upload Preset

1. Go to **Settings** → **Upload**
2. Scroll to **Upload presets** section
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `twinkle-hearts-products`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `twinkle-hearts/products`
   - **Overwrite**: `false` (recommended)
   - **Resource type**: `Image`
5. Click **Save**

### Step 4: Configure Environment Variables

#### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3001
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
VITE_CLOUDINARY_UPLOAD_PRESET=twinkle-hearts-products
```

#### Backend (`backend/.env.local`) - Optional

Only needed for server-side operations like deleting images:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Usage

### Uploading Product Images

1. Navigate to **Admin** → **Products** → **Add Product**
2. Click on the upload area to select images
3. Images will show as local previews (not uploaded yet)
4. Fill in product details
5. Click **Create Product**
6. Images are uploaded to Cloudinary, then the product is saved

### Image Optimization

Use the image transformation utilities in your components:

```tsx
import { getThumbnail, getDetailImage, getSrcSet } from '../utils/images';

// Thumbnail for product cards
<img src={getThumbnail(product.images[0])} alt={product.name} />

// Full-size for product detail
<img src={getDetailImage(product.images[0])} alt={product.name} />

// Responsive srcset
<img src={product.images[0]} srcSet={getSrcSet(product.images[0])} alt={product.name} />
```

### Available Transformations

| Function | Purpose | Default Size |
|----------|---------|--------------|
| `getThumbnail(url)` | Product cards | 300x300 |
| `getDetailImage(url)` | Product detail page | 800px width |
| `getHeroImage(url)` | Hero/banner | 1200x600 |
| `getIcon(url)` | Small icons | 64x64 |
| `getPlaceholder(url)` | Lazy loading blur | 20px, blurred |
| `getAvatar(url)` | User avatars | 150x150 circular |

## File Structure

```
frontend/
├── src/
│   ├── utils/
│   │   ├── cloudinary.ts      # Upload functions
│   │   └── images.ts          # Transformation helpers
│   ├── components/
│   │   └── ImageUpload.tsx    # Upload component
│   └── pages/Admin/
│       └── ProductsPage.tsx   # Product form
└── .env.example               # Environment template

backend/
└── .env.example               # Environment template (optional)
```

## API Reference

### `uploadImages(files, options)`

Uploads multiple images to Cloudinary.

```typescript
import { uploadImages } from '../utils/cloudinary';

const results = await uploadImages(files, {
  folder: 'twinkle-hearts/products',
  tags: ['product', 'featured'],
});

// Returns array of:
// { secure_url, public_id, format, width, height, bytes }
```

### `getImageUrl(url, options)`

Transforms a Cloudinary URL with specified options.

```typescript
import { getImageUrl } from '../utils/images';

const optimized = getImageUrl(url, {
  width: 500,
  quality: 'auto:good',
  format: 'auto',  // WebP/AVIF for modern browsers
});
```

## Troubleshooting

### Images not uploading

1. Check that `VITE_CLOUDINARY_CLOUD_NAME` is set correctly
2. Verify the upload preset name matches exactly
3. Ensure the preset is set to **Unsigned** mode
4. Check browser console for error messages

### CORS errors

Cloudinary allows uploads from any domain by default. If you see CORS errors:

1. Go to Cloudinary Settings → Security
2. Check "Allowed domains for unsigned uploads"
3. Add your domain (e.g., `localhost:5173` for development)

### Images not displaying

1. Check if the URL is correct
2. Verify the image exists in your Cloudinary media library
3. Use `isCloudinaryUrl(url)` to check if it's a Cloudinary URL

## Migration from Local Storage

If you have existing products with local image paths:

1. Images stored in `uploads/products/` will still work
2. New uploads will go to Cloudinary
3. To migrate existing images, use the migration script:

```bash
# Coming soon: Migration script to upload local images to Cloudinary
npm run migrate:images
```

## Best Practices

1. **Image sizes**: Keep original images under 5MB
2. **Formats**: Use JPEG for photos, PNG for transparency, WebP for best compression
3. **Naming**: Use descriptive filenames (they're preserved in Cloudinary context)
4. **Organization**: Use folders to organize images by type
5. **Cleanup**: Periodically review unused images in Cloudinary dashboard

## Cost Optimization

- Use `quality: 'auto:good'` for most images
- Use `format: 'auto'` for automatic WebP/AVIF delivery
- Set appropriate size limits to avoid storing unnecessarily large images
- Use `getThumbnail()` for product cards instead of full-size images

## Support

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)
- [Image Transformations Reference](https://cloudinary.com/documentation/image_transformations)
