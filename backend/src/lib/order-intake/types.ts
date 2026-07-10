export interface ValidatedItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
  stockAvailable: number;
}

export interface PricingResult {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface OrderIntakeInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    quantity: number;
    currentPrice: number;
    productName: string;
  }>;
}

export interface OrderIntakeResult {
  order: {
    id: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    customerName: string;
    customerPhone: string;
    createdAt: Date;
  };
  whatsappDeepLink: string;
}
