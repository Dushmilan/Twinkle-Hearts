interface OrderForMessage {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export function formatOrderMessage(order: OrderForMessage): string {
  const itemsList = order.items
    .map((item, idx) => `${idx + 1}. ${item.productName} x${item.quantity} - ₹${item.price}`)
    .join('\n');

  return [
    '🛒 *NEW ORDER REQUEST*',
    '━━━━━━━━━━━━━━━━━━━━',
    `*Order ID:* ${order.id.slice(0, 8).toUpperCase()}`,
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.customerPhone}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '*Items:*',
    itemsList,
    '━━━━━━━━━━━━━━━━━━━━',
    `*Subtotal:* ₹${order.subtotal}`,
    `*Tax (18%):* ₹${order.tax}`,
    `*TOTAL:* ₹${order.total}`,
    '━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');
}

export function buildWhatsAppDeepLink(businessNumber: string, message: string): string {
  return `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
}
