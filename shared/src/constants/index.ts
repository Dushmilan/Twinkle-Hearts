// Shared constants for Twinkle-Hearts

export const WHATSAPP_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || '919876543210';

export const ORDER_STATUS = {
  PENDING: 'PENDING_WHATSAPP_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export const ORDER_EXPIRY_MINUTES = 15;

export const TAX_RATE = 0.18; // 18% GST

export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
} as const;

export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CART_SYNC: '/api/cart/sync',
  ORDERS_CREATE: '/api/orders/create',
  ORDERS_GET: (orderId: string) => `/api/orders/${orderId}`,
  ORDERS_CONFIRM: (orderId: string) => `/api/orders/${orderId}/confirm`,
} as const;

export const WHATSAPP_MESSAGE_TEMPLATES = {
  ORDER_REQUEST: (order: {
    id: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    total: number;
  }) => `
🛒 *NEW ORDER REQUEST*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* ${order.id.slice(0, 8).toUpperCase()}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
━━━━━━━━━━━━━━━━━━━━
*Items:*
${order.items.map((item, idx) => `${idx + 1}. ${item.name} x${item.quantity} - ₹${item.price}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ₹${order.subtotal}
*Tax (18%):* ₹${order.tax}
*TOTAL:* ₹${order.total}
━━━━━━━━━━━━━━━━━━━━
*Please confirm this order.*
  `.trim(),

  ORDER_CONFIRMED: (orderId: string, total: number) => `
✅ *ORDER CONFIRMED*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* ${orderId.slice(0, 8).toUpperCase()}
*Total:* ₹${total}
━━━━━━━━━━━━━━━━━━━━
Thank you for your order! We'll process it shortly.
  `.trim(),
};

export const PWA_CONFIG = {
  name: 'Twinkle-Hearts Jewelry',
  short_name: 'TwinkleHearts',
  description: 'Beautiful jewelry delivered via WhatsApp',
  theme_color: '#ec4899',
  background_color: '#ffffff',
  display: 'standalone',
  start_url: '/',
} as const;
