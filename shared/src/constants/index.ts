// Shared constants for Twinkle-Hearts

export const WHATSAPP_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || '947XXXXXXXX';

export const TAX_RATE = 0.18; // 18% VAT

export const CURRENCY = {
  code: 'LKR',
  symbol: 'Rs.',
  locale: 'en-LK',
} as const;

export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CART_SYNC: '/api/cart/sync',
  ORDERS_CREATE: '/api/orders/create',
  ORDERS_GET: (orderId: string) => `/api/orders/${orderId}`,
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
${order.items.map((item, idx) => `${idx + 1}. ${item.name} x${item.quantity} - Rs. ${item.price}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━
*Subtotal:* Rs. ${order.subtotal}
*Tax (18%):* Rs. ${order.tax}
*TOTAL:* Rs. ${order.total}
━━━━━━━━━━━━━━━━━━━━
  `.trim(),
};

export const PWA_CONFIG = {
  name: 'Twinkle-Hearts — Greeting Cards',
  short_name: 'TwinkleHearts',
  description: 'Beautiful greeting cards delivered with love via WhatsApp',
  theme_color: '#E8734A',
  background_color: '#FDF8F4',
  display: 'standalone',
  start_url: '/',
} as const;
