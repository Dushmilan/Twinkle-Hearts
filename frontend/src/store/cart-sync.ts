import { api } from '../api.js';
import type { CartItem } from './cartStore';

interface SyncResult {
  items: CartItem[];
  updatedAt: number;
}

export async function syncWithBackend(items: CartItem[]): Promise<SyncResult> {
  if (items.length === 0) {
    return { items, updatedAt: Date.now() };
  }

  const data = await api.cart.sync({
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  const updatedItems = items.map((item) => {
    const validatedItem = data.items.find(
      (v) => v.productId === item.productId
    );
    return validatedItem
      ? {
          ...item,
          price: validatedItem.currentPrice,
          productName: validatedItem.productName,
        }
      : item;
  });

  return { items: updatedItems, updatedAt: Date.now() };
}
