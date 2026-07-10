import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('cartStore', () => {
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
      json: async () => ({ items: [] }),
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      await useCartStore.getState().addItem({
        productId: 'prod-1',
        quantity: 1,
        price: 2999,
        productName: 'Test Product',
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-1');
      expect(items[0].quantity).toBe(1);
    });

    it('should increase quantity for existing item', async () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 2999, addedAt: Date.now() }],
      });

      await useCartStore.getState().addItem({
        productId: 'prod-1',
        quantity: 3,
        price: 2999,
      });

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should sync with backend when online', async () => {
      await useCartStore.getState().addItem({
        productId: 'prod-1',
        quantity: 1,
        price: 100,
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      useCartStore.setState({ isOnline: false });

      await useCartStore.getState().addItem({
        productId: 'prod-1',
        quantity: 1,
        price: 100,
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 1, price: 100, addedAt: Date.now() }],
      });

      useCartStore.getState().removeItem('prod-1');

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should not affect other items when removing', () => {
      useCartStore.setState({
        items: [
          { productId: 'prod-1', quantity: 1, price: 100, addedAt: Date.now() },
          { productId: 'prod-2', quantity: 3, price: 200, addedAt: Date.now() },
        ],
      });

      useCartStore.getState().removeItem('prod-1');

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].productId).toBe('prod-2');
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity for existing item', () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() }],
      });

      useCartStore.getState().updateQuantity('prod-1', 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0', () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() }],
      });

      useCartStore.getState().updateQuantity('prod-1', 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should remove item if quantity is negative', () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() }],
      });

      useCartStore.getState().updateQuantity('prod-1', -1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items', () => {
      useCartStore.setState({
        items: [
          { productId: 'prod-1', quantity: 1, price: 100, addedAt: Date.now() },
          { productId: 'prod-2', quantity: 2, price: 200, addedAt: Date.now() },
        ],
      });

      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('syncCart', () => {
    it('should send cart items to API', async () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 2999, addedAt: Date.now() }],
      });

      await useCartStore.getState().syncCart();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cart/sync',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should do nothing when cart is empty', async () => {
      await useCartStore.getState().syncCart();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set isSyncing during sync', async () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 1, price: 100, addedAt: Date.now() }],
      });

      const syncPromise = useCartStore.getState().syncCart();

      expect(useCartStore.getState().isSyncing).toBe(true);

      await syncPromise;

      expect(useCartStore.getState().isSyncing).toBe(false);
    });

    it('should update items from sync response', async () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() }],
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [{ productId: 'prod-1', quantity: 2, currentPrice: 150, productName: 'Updated Product' }],
        }),
      });

      await useCartStore.getState().syncCart();

      const items = useCartStore.getState().items;
      expect(items[0].price).toBe(150);
      expect(items[0].productName).toBe('Updated Product');
    });
  });

  describe('setOnlineStatus', () => {
    it('should update online status', () => {
      useCartStore.getState().setOnlineStatus(false);
      expect(useCartStore.getState().isOnline).toBe(false);

      useCartStore.getState().setOnlineStatus(true);
      expect(useCartStore.getState().isOnline).toBe(true);
    });

    it('should trigger sync when coming online with items', () => {
      useCartStore.setState({
        items: [{ productId: 'prod-1', quantity: 1, price: 100, addedAt: Date.now() }],
        isOnline: false,
      });
      mockFetch.mockReset();

      useCartStore.getState().setOnlineStatus(true);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not sync coming online with empty cart', () => {
      useCartStore.getState().setOnlineStatus(true);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getTotal', () => {
    it('should calculate total of all items', () => {
      useCartStore.setState({
        items: [
          { productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() },
          { productId: 'prod-2', quantity: 3, price: 50, addedAt: Date.now() },
        ],
      });

      const total = useCartStore.getState().getTotal();
      expect(total).toBe(350);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should count total quantity across all items', () => {
      useCartStore.setState({
        items: [
          { productId: 'prod-1', quantity: 2, price: 100, addedAt: Date.now() },
          { productId: 'prod-2', quantity: 3, price: 50, addedAt: Date.now() },
        ],
      });

      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });
  });
});
