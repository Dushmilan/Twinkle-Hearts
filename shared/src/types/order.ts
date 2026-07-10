export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  tax: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CreateOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  customerName: string;
  customerPhone: string;
}

export interface CreateOrderResponse {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  whatsappDeepLink: string;
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  customerName: string;
  createdAt: string;
}

export interface OrderResponse {
  order: OrderSummary;
}
