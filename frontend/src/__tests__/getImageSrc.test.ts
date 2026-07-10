import { describe, it, expect } from 'vitest';

describe('getImageSrc', () => {
  it('should return empty string for undefined', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc(undefined)).toBe('');
  });

  it('should return empty string for null', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc(null)).toBe('');
  });

  it('should return empty string for empty string', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc('')).toBe('');
  });

  it('should return absolute https URLs unchanged', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('should return absolute http URLs unchanged', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('should return relative /images/ paths unchanged when VITE_API_URL is empty', async () => {
    const { getImageSrc } = await import('../utils/images');
    expect(getImageSrc('/images/products/abc.jpg')).toBe('/images/products/abc.jpg');
  });

  it('should handle picsum external URLs (seed data)', async () => {
    const { getImageSrc } = await import('../utils/images');
    const picsumUrl = 'https://picsum.photos/seed/test/200/200';
    expect(getImageSrc(picsumUrl)).toBe(picsumUrl);
  });
});
