# Cloudinary Integration Setup Guide

This guide explains how to set up Cloudinary for image storage in the Twinkle-Hearts e-commerce platform.

## Overview

The application uses **Cloudinary** for cloud-based image storage and delivery. Images are uploaded via the **backend API** using **signed uploads**, which provides:

- **Security**: API credentials are kept on the server
- **Control**: Backend can validate files before uploading
- **No orphaned files**: Images are only uploaded when the product form is submitted
- **CDN delivery**: Fast image loading worldwide
- **Automatic optimization**: WebP/AVIF conversion, compression

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   Cloudinary    │
│                 │     │                 │     │                 │
│ 1. Select files │     │                 │     │                 │
│ 2. Local preview│     │                 │     │                 │
│ 3. Submit form  │────▶│ 4. Validate     │     │                 │
│                 │     │ 5. Sign upload  │────▶│ 6. Store images │
│                 │     │                 │     │ 7. Return URLs  │
│                 │     │ 8. Return URLs  │◀────│                 │
│                 │◀────│                 │     │                 │
│                 │     │ 9. Save product │     │                 │
│                 │     │    with URLs    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Setup Instructions

### Step 1: Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. The free tier includes:
   - 25 GB storage
   - 25 GB monthly bandwidth
   - 300,000 transformations

### Step 2: Get Your Credentials

1. Log in to your Cloudinary dashboard
2. Copy the following from your dashboard:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)

### Step 3: Configure Backend Environment

Add the credentials to `backend/.env.local`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

**Important**: Never commit these credentials to version control!

### Step 4: Install Dependencies

The `cloudinary` npm package is already added to `backend/package.json`. Install it:

```bash
cd backend
npm install
```

## Usage

### Uploading Product Images

1. Navigate to **Admin** → **Products** → **Add Product**
2. Click on the upload area to select images
3. Images will show as local previews (not uploaded yet)
4. Fill in product details
5. Click **Create Product**
6. The backend uploads images to Cloudinary and returns URLs
7. Product is saved with the Cloudinary image URLs

### Image Flow

```
User selects images → Local preview shown → User clicks submit
→ Frontend sends files to backend → Backend uploads to Cloudinary
→ Cloudinary returns URLs → Backend returns URLs to frontend
→ Product saved with image URLs
```

## API Reference

### Backend Upload Endpoint

**POST** `/api/admin/products/upload`

Headers:
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

Body:
- `images`: File(s) to upload (max 10 files, 5MB each)

Response:
```json
{
  "success": true,
  "data": {
    "urls": ["https://res.cloudinary.com/..."],
    "count": 1
  }
}
```

### Frontend Upload Function

```typescript
import { uploadImages } from '../utils/cloudinary';

// Upload images via backend API
const urls = await uploadImages(files, authToken);
// Returns: string[] of Cloudinary URLs
```

## Image Optimization

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
backend/
├── src/
│   └── lib/
│       └── cloudinary.ts      # Cloudinary service (signed uploads)
├── .env.example               # Environment template
└── package.json               # Includes cloudinary dependency

frontend/
├── src/
│   ├── utils/
│   │   ├── cloudinary.ts      # Upload via backend API
│   │   └── images.ts          # Transformation helpers
│   ├── components/
│   │   └── ImageUpload.tsx    # Upload component
│   └── pages/Admin/
│       └── ProductsPage.tsx   # Product form
└── .env.example               # Environment template
```

## Troubleshooting

### Images not uploading

1. Check that Cloudinary credentials are set in `backend/.env.local`
2. Verify the backend server is running
3. Check browser network tab for API errors
4. Check backend logs for Cloudinary errors

### "Cloudinary not configured" warning

If you see this warning in backend logs:
- Cloudinary credentials are missing
- Images will be stored locally as fallback
- Add credentials to `backend/.env.local` and restart server

### CORS errors

The backend handles uploads, so CORS should not be an issue. If you see CORS errors:
1. Ensure `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL
2. Check that the frontend is using the correct API URL

### Images not displaying

1. Check if the URL is correct in the database
2. Verify the image exists in your Cloudinary media library
3. Use `isCloudinaryUrl(url)` to check if it's a Cloudinary URL

## Security Best Practices

1. **Never expose API Secret** in frontend code
2. **Use signed uploads** (handled by backend)
3. **Validate file types** before upload (handled by backend)
4. **Limit file sizes** (5MB max per image)
5. **Use authentication** for upload endpoints (admin only)

## Cost Optimization

- Use `quality: 'auto:good'` for most images
- Use `format: 'auto'` for automatic WebP/AVIF delivery
- Set appropriate size limits to avoid storing unnecessarily large images
- Use `getThumbnail()` for product cards instead of full-size images

## Migration from Local Storage

If you have existing products with local image paths:

1. Images stored in `uploads/products/` will still work
2. New uploads will go to Cloudinary
3. To migrate existing images, manually upload them to Cloudinary and update the database

## Support

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations Reference](https://cloudinary.com/documentation/image_transformations)
