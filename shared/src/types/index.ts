// Shared types for Twinkle-Hearts e-commerce platform

// ============================================
// PRODUCT TYPES
// ============================================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
  images: string[];
}

// ============================================
// CART TYPES
// ============================================
export interface CartItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  image?: string;
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

// ============================================
// ORDER TYPES
// ============================================
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

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ProductsResponse {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductDetailResponse {
  product: Product;
}

// ============================================
// WHATSAPP TYPES
// ============================================
export interface WhatsAppMessage {
  to: string;
  message: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}

// ============================================
// UTILITY TYPES
// ============================================
export type ApiResponse<T> = T | ErrorResponse;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
