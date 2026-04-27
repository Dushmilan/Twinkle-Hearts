import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';
import { useAuthStore } from '../authStore';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          price: 100,
          addedAt: Date.now(),
        },
      ],
      isOnline: true,
      isSyncing: false,
      lastSyncedAt: null,
    });
    useAuthStore.setState({
      user: null,
      tokens: {
        accessToken: 'test-access-token-123',
        refreshToken: 'test-refresh-token-456',
      },
      isAuthenticated: true,
      isLoading: false,
    });
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  it('should include Authorization header when syncing cart with backend', async () => {
    await useCartStore.getState().syncWithBackend();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cart/sync',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token-123',
        }),
      })
    );
  });

  it('should make PUT request to /api/cart/sync when items exist', async () => {
    await useCartStore.getState().syncWithBackend();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cart/sync',
      expect.objectContaining({
        method: 'POST',
      })
    );
    const callArg = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArg.body);
    expect(body.items).toBeDefined();
    expect(body.items.length).toBe(1);
    expect(body.items[0].productId).toBe('prod-1');
  });

  it('should do nothing when cart is empty', async () => {
    useCartStore.setState({ items: [] });
    await useCartStore.getState().syncWithBackend();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
