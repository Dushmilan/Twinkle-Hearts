import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, setTokenGetter, ApiClientError } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTokenGetter(null);
    mockFetch.mockReset();
  });

  describe('request function', () => {
    it('should make GET request by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ products: [] }),
      });

      const result = await api.products.list();
      expect(mockFetch).toHaveBeenCalledWith('/api/products', expect.any(Object));
      expect(result.products).toEqual([]);
    });

    it('should include authorization header when authenticated', async () => {
      setTokenGetter(() => 'test-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: 'u1' } }),
      });

      await api.auth.me();

      const callArgs = mockFetch.mock.calls[0];
      const options = callArgs[1];
      expect(options.headers['Authorization']).toBe('Bearer test-token');
    });

    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await api.auth.login({ email: 'test@example.com', password: 'pass' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should throw ApiClientError on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      await expect(api.auth.login({ email: 'test@example.com', password: 'pass' })).rejects.toThrow(ApiClientError);
    });

    it('should parse error message from response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      try {
        await api.auth.login({ email: 'test@example.com', password: 'wrong' });
      } catch (e: any) {
        expect(e.message).toBe('Invalid credentials');
        expect(e.status).toBe(401);
      }
    });

    it('should handle non-json error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('not json'); },
      });

      try {
        await api.products.list();
      } catch (e: any) {
        expect(e.message).toContain('Request failed with status 500');
      }
    });

    it('should build query strings for product list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ products: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      });

      await api.products.list({ page: 2, limit: 10, search: 'test', category: 'Electronics' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('search=test');
      expect(url).toContain('category=Electronics');
    });

    it('should encode search query for product search', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ products: [] }),
      });

      await api.products.search('hello world');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('q=');
    });
  });

  describe('order create', () => {
    it('should send order data as authenticated POST', async () => {
      setTokenGetter(() => 'token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ orderId: 'order-1', total: 100, whatsappDeepLink: 'https://wa.me/...' }),
      });

      await api.orders.create({
        items: [{ productId: 'prod-1', quantity: 2, price: 1500 }],
        customerName: 'John',
        customerPhone: '+919876543210',
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer token');
    });
  });

  describe('admin upload', () => {
    it('should send FormData for image upload', async () => {
      setTokenGetter(() => 'token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { urls: ['https://img.jpg'], count: 1 } }),
      });

      const formData = new FormData();
      formData.append('images', new Blob(['test']), 'test.jpg');

      const result = await api.admin.products.upload(formData);

      expect(result.data.urls).toHaveLength(1);
    });
  });

  describe('wishlist', () => {
    it('should add to wishlist', async () => {
      setTokenGetter(() => 'token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'wish-1', productId: 'prod-1', product: { id: 'prod-1', name: 'Test', price: 100, images: [], stock: 10 } }),
      });

      const result = await api.wishlist.add('prod-1');
      expect(result.productId).toBe('prod-1');
    });

    it('should remove from wishlist', async () => {
      setTokenGetter(() => 'token');
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      await api.wishlist.remove('prod-1');
      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('DELETE');
    });
  });
});