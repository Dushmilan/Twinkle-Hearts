# Bugfix: R2 Images Not Deleted on Product Removal

## Problem

When a product is deleted via `DELETE /api/admin/products/:id`, its images remain
orphaned in R2 storage. The database row is removed but the R2 objects are never
cleaned up.

## Root Cause

A format mismatch between how R2 images are **stored** vs how they're **detected**
during deletion.

| Step | Function | Stored Value |
|------|----------|-------------|
| Upload | `uploadToR2()` | Raw key: `products/uuid.jpg` |
| Serving | `normalizeImages()` | Prefixed: `/images/products/uuid.jpg` |
| Delete | `isR2Url()` filter | Checks `startsWith('/images/')` → **false** for raw keys |

The `deleteProduct` function in `adminService.ts:74-84` filters images with
`isR2Url()`, which only matches the `/images/`-prefixed served format. Since the
DB stores raw keys, the filter rejects every image and `deleteMultipleFromR2`
is never called.

## Fix

### 1. `backend/src/services/adminService.ts` — `deleteProduct()`

Replace the R2 detection block (lines 74-84) to handle both raw keys and
prefixed URLs:

```ts
const images: string[] = JSON.parse(product.images || '[]');
if (images.length > 0) {
  const r2Keys = images
    .filter((url: string) => !url.startsWith('http://') && !url.startsWith('https://'))
    .map((url: string) => url.replace(/^\/images\//, ''))
    .filter((k: string): k is string => !!k);

  if (r2Keys.length > 0) {
    await deleteMultipleFromR2(env.R2, r2Keys);
  }
}
```

- Filters out absolute URLs (external) — only local R2 keys remain
- Strips `/images/` prefix if present — handles both storage formats
- Passes clean keys to `deleteMultipleFromR2`

### 2. `backend/src/services/__tests__/adminService.test.ts` — New tests

Add tests for the `deleteProduct` image cleanup:

- **Raw R2 keys**: product with `images: '["products/abc.jpg"]'` → calls `deleteMultipleFromR2` with `["products/abc.jpg"]`
- **Prefixed R2 URLs**: product with `images: '["/images/products/abc.jpg"]'` → calls `deleteMultipleFromR2` with `["products/abc.jpg"]`
- **Mixed formats**: raw key + prefixed URL + absolute URL → only R2 keys deleted
- **External URLs skipped**: product with `images: '["https://example.com/img.jpg"]'` → `deleteMultipleFromR2` not called
- **Empty images**: product with `images: '[]'` → `deleteMultipleFromR2` not called

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/adminService.ts` | Fix R2 key extraction in `deleteProduct` |
| `backend/src/services/__tests__/adminService.test.ts` | Add image cleanup tests |

## Verification

```bash
npm run test --workspace=backend
npm run typecheck
```
