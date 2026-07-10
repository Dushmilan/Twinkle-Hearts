import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { upsertCartItem, removeCartItem, updateCartItemQuantity, clearCartItems } from './cart-db';
import { syncWithBackend } from './cart-sync';

export interface CartItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  image?: string;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  lastSyncedAt: number | null;
  isSyncing: boolean;
  isOnline: boolean;

  addItem: (product: Omit<CartItem, 'addedAt'>) => Promise<void>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastSyncedAt: null,
      isSyncing: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      addItem: async (product) => {
        const addedAt = Date.now();

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.productId
          );

          let newItems;
          if (existingItem) {
            newItems = state.items.map((item) =>
              item.productId === product.productId
                ? { ...item, quantity: item.quantity + product.quantity }
                : item
            );
          } else {
            newItems = [...state.items, { ...product, addedAt }];
          }

          return { items: newItems };
        });

        await upsertCartItem(product.productId, product.quantity, addedAt);

        if (get().isOnline) {
          await get().syncCart();
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        removeCartItem(productId);
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));

        updateCartItemQuantity(productId, quantity);
      },

      clearCart: () => {
        set({ items: [] });
        clearCartItems();
      },

      syncCart: async () => {
        const { items } = get();
        if (items.length === 0) return;

        set({ isSyncing: true });

        try {
          const { items: updatedItems, updatedAt } = await syncWithBackend(items);
          set({ items: updatedItems, lastSyncedAt: updatedAt });
        } catch (error) {
          console.error('Cart sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });

        if (isOnline && get().items.length > 0) {
          get().syncCart();
        }
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

// Standalone selectors — use these in components for reactivity
export const selectCartItems = (state: CartState) => state.items;
export const selectCartTotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const selectCartItemCount = (state: CartState) =>
  state.items.reduce((count, item) => count + item.quantity, 0);
export const selectIsSyncing = (state: CartState) => state.isSyncing;
export const selectIsOnline = (state: CartState) => state.isOnline;
