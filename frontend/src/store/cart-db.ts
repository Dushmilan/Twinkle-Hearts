import { db } from './db';

export async function upsertCartItem(productId: string, quantity: number, addedAt: number): Promise<void> {
  try {
    const existing = await db.cart.get({ productId });
    if (existing) {
      await db.cart.update(existing.id!, { quantity: existing.quantity + quantity });
    } else {
      await db.cart.add({ productId, quantity, addedAt });
    }
  } catch {
    // IndexedDB is optional for persistence
  }
}

export async function removeCartItem(productId: string): Promise<void> {
  try {
    await db.cart.where('productId').equals(productId).delete();
  } catch (error) {
    console.error('Failed to remove cart item from IndexedDB:', error);
  }
}

export async function updateCartItemQuantity(productId: string, quantity: number): Promise<void> {
  try {
    await db.cart.where('productId').equals(productId).modify({ quantity });
  } catch (error) {
    console.error('Failed to update cart item in IndexedDB:', error);
  }
}

export async function clearCartItems(): Promise<void> {
  try {
    await db.cart.clear();
  } catch (error) {
    console.error('Failed to clear cart from IndexedDB:', error);
  }
}
