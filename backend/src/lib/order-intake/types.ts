export interface ValidatedItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
  stockAvailable: number;
  category: string | null;
}

// Product categories fulfilled as a service (artist visit, no inventory).
// Bookings for these skip stock-availability checks and reservation.
export const SERVICE_CATEGORIES: ReadonlySet<string> = new Set(['rangoli']);

export function isServiceCategory(category: string | null | undefined): boolean {
  return typeof category === 'string' && SERVICE_CATEGORIES.has(category);
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
    category?: string | null;
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
