import Dexie, { Table } from 'dexie';

export interface CartItemDB {
  id?: number;
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface PendingOrder {
  id?: number;
  orderId: string;
  status: string;
  data: any;
  createdAt: number;
}

class TwinkleHeartsDB extends Dexie {
  cart!: Table<CartItemDB, number>;
  pendingOrders!: Table<PendingOrder, number>;

  constructor() {
    super('TwinkleHeartsDB');
    
    this.version(1).stores({
      cart: '++id, productId, addedAt',
      pendingOrders: '++id, orderId, status, createdAt',
    });
  }
}

export const db = new TwinkleHeartsDB();
