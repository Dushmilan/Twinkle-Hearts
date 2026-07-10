export interface CartItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface CartSyncInput {
  items: Array<{
    productId: string;
    quantity: number;
    price?: number;
  }>;
}

export interface ValidatedCartItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
  stockAvailable: number;
  inStock: boolean;
}

export interface CartSyncResponse {
  items: ValidatedCartItem[];
  syncedAt: string;
}
