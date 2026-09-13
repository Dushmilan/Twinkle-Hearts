import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('cart sync trust boundary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.setState({
      items: [],
      lastSyncedAt: null,
      isSyncing: false,
      isOnline: true,
    });
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ productId: 'p1', quantity: 2, currentPrice: 2500, productName: 'Birthday Card' }],
        syncedAt: new Date().toISOString(),
      }),
    });
  });

  it('replaces local prices with server prices after sync', async () => {
    // Arrange: seed the store with a forged local price of 1 LKR.
    useCartStore.setState({
      items: [{ productId: 'p1', quantity: 2, price: 1, addedAt: Date.now() }],
    });

    // Act: run the same sync call the app uses on reconnect.
    await useCartStore.getState().syncCart();

    // Assert: stored item price is 2500 and cart total is 5000.
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(2500);
    expect(items[0].price).not.toBe(1);
    expect(useCartStore.getState().getTotal()).toBe(5000);
  });
});
