import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from './db';
import { CartItemDB } from './db';

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
  
  // Actions
  addItem: (product: Omit<CartItem, 'addedAt'>) => Promise<void>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithBackend: () => Promise<void>;
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
      isOnline: navigator.onLine,

      addItem: async (product) => {
        const addedAt = Date.now();
        const newItem = { ...product, addedAt };

        // Optimistic update
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
            newItems = [...state.items, newItem];
          }

          return { items: newItems };
        });

        // Persist to IndexedDB
        try {
          const existingItem = await db.cart.get({ productId: product.productId });
          
          if (existingItem) {
            await db.cart.update(existingItem.id!, {
              quantity: existingItem.quantity + product.quantity,
            });
          } else {
            await db.cart.add({
              productId: product.productId,
              quantity: product.quantity,
              addedAt,
            });
          }
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error);
        }

        // Sync with backend when online
        if (get().isOnline) {
          await get().syncWithBackend();
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));

        // Remove from IndexedDB
        db.cart.where('productId').equals(productId).delete().catch(console.error);
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

        // Update IndexedDB
        db.cart.where('productId').equals(productId).modify({ quantity }).catch(console.error);
      },

      clearCart: () => {
        set({ items: [] });
        db.cart.clear().catch(console.error);
      },

      syncWithBackend: async () => {
        const { items } = get();
        
        if (items.length === 0) return;

        set({ isSyncing: true });

        try {
          const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            }),
          });

          if (!response.ok) throw new Error('Sync failed');

          const data = await response.json();
          
          // Update items with validated prices from backend
          const updatedItems = items.map((item) => {
            const validatedItem = data.items.find(
              (v: any) => v.productId === item.productId
            );
            return validatedItem
              ? {
                  ...item,
                  price: validatedItem.currentPrice,
                  productName: validatedItem.productName,
                }
              : item;
          });

          set({
            items: updatedItems,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          console.error('Cart sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        
        if (isOnline && get().items.length > 0) {
          get().syncWithBackend();
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
        lastSyncedAt: state.lastSyncedAt 
      }),
    }
  )
);
