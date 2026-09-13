import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ImageUploadError,
  validateImage,
  uploadToR2,
  uploadToR2FromBuffer,
  deleteFromR2,
  deleteMultipleFromR2,
  getPublicUrl,
  extractR2Key,
  isR2Url,
} from '../images.js';

interface TestFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

const validFile = (overrides: Partial<TestFile> = {}): TestFile => ({
  name: 'photo.jpg',
  type: 'image/jpeg',
  size: 1024,
  arrayBuffer: async () => new ArrayBuffer(8),
  ...overrides,
});

function createFakeR2() {
  const puts: Array<{ key: string; value: unknown }> = [];
  const deletes: string[][] = [];
  const r2 = {
    put: vi.fn(async (key: string, value: unknown): Promise<void> => {
      puts.push({ key, value });
    }),
    delete: vi.fn(async (key: string | string[]): Promise<void> => {
      deletes.push(Array.isArray(key) ? key : [key]);
    }),
  };
  return { puts, deletes, r2: r2 as unknown as R2Bucket };
}

describe('images lib', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateImage', () => {
    it('accepts allowed types under the size limit', () => {
      for (const type of ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
        expect(() => validateImage(validFile({ type }))).not.toThrow();
      }
    });

    it('rejects disallowed types with ImageUploadError', () => {
      try {
        validateImage(validFile({ type: 'application/pdf' }));
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ImageUploadError);
        expect((error as ImageUploadError).statusCode).toBe(400);
      }
    });

    it('rejects oversized files', () => {
      expect(() => validateImage(validFile({ size: 6 * 1024 * 1024 }))).toThrow(
        'File too large',
      );
    });
  });

  describe('uploadToR2', () => {
    it('validates then stores under a products/ key and returns it', async () => {
      const { puts, r2 } = createFakeR2();

      const key = await uploadToR2(r2, validFile({ name: 'card.png' }));

      expect(key.startsWith('products/')).toBe(true);
      expect(key.endsWith('.png')).toBe(true);
      expect(puts).toHaveLength(1);
      expect(puts[0].key).toBe(key);
    });

    it('rejects invalid files before touching R2', async () => {
      const { puts, r2 } = createFakeR2();

      await expect(uploadToR2(r2, validFile({ type: 'text/plain' }))).rejects.toThrow(
        ImageUploadError,
      );
      expect(puts).toHaveLength(0);
    });
  });

  describe('uploadToR2FromBuffer', () => {
    it('stores the buffer and returns the key', async () => {
      const { puts, r2 } = createFakeR2();

      const key = await uploadToR2FromBuffer(r2, new ArrayBuffer(4), 'scan.webp', 'image/webp');

      expect(key.startsWith('products/')).toBe(true);
      expect(puts[0].key).toBe(key);
    });
  });

  describe('deletion + url helpers', () => {
    it('deletes single and multiple keys', async () => {
      const { deletes, r2 } = createFakeR2();

      await deleteFromR2(r2, 'a.jpg');
      await deleteMultipleFromR2(r2, ['b.jpg', 'c.jpg']);

      expect(deletes).toEqual([['a.jpg'], ['b.jpg', 'c.jpg']]);
    });

    it('builds public urls and extracts keys', () => {
      expect(getPublicUrl('products/x.jpg')).toBe('/images/products/x.jpg');
      expect(extractR2Key('/images/products/x.jpg')).toBe('products/x.jpg');
      expect(extractR2Key('https://elsewhere/y.jpg')).toBeNull();
    });

    it('detects R2 urls', () => {
      expect(isR2Url('/images/a.jpg')).toBe(true);
      expect(isR2Url('https://cdn.example/a.jpg')).toBe(false);
      expect(isR2Url(undefined as unknown as string)).toBe(false);
    });
  });
});
