import { describe, it, expect } from 'vitest';
import { formatOrderMessage, buildWhatsAppDeepLink } from '../whatsapp-formatter.js';

describe('formatOrderMessage', () => {
  const mockOrder = {
    id: 'order-abc123def',
    customerName: 'John Doe',
    customerPhone: '+919876543210',
    items: [
      { productName: 'Birthday Card', quantity: 2, price: 2999 },
    ],
    subtotal: 5998,
    tax: 1079.64,
    total: 7077.64,
  };

  it('should include order details', () => {
    const message = formatOrderMessage(mockOrder);

    expect(message).toContain('NEW ORDER REQUEST');
    expect(message).toContain('ORDER-AB');
    expect(message).toContain('John Doe');
    expect(message).toContain('+919876543210');
  });

  it('should include item details', () => {
    const message = formatOrderMessage(mockOrder);

    expect(message).toContain('Birthday Card');
    expect(message).toContain('x2');
    expect(message).toContain('₹2999');
  });

  it('should include pricing breakdown', () => {
    const message = formatOrderMessage(mockOrder);

    expect(message).toContain('₹5998');
    expect(message).toContain('₹1079.64');
    expect(message).toContain('₹7077.64');
  });

  it('should handle multiple items', () => {
    const order = {
      ...mockOrder,
      items: [
        { productName: 'Card A', quantity: 1, price: 500 },
        { productName: 'Card B', quantity: 3, price: 750 },
      ],
    };

    const message = formatOrderMessage(order);

    expect(message).toContain('Card A');
    expect(message).toContain('Card B');
    expect(message).toContain('1. Card A');
    expect(message).toContain('2. Card B');
  });
});

describe('buildWhatsAppDeepLink', () => {
  it('should build a valid wa.me URL', () => {
    const link = buildWhatsAppDeepLink('+94771234567', 'Hello World');

    expect(link).toContain('https://wa.me/+94771234567');
    expect(link).toContain('text=');
    expect(link).toContain(encodeURIComponent('Hello World'));
  });

  it('should encode special characters', () => {
    const link = buildWhatsAppDeepLink('+94771234567', 'Order #123: Total ₹500');

    expect(link).toContain(encodeURIComponent('Order #123: Total ₹500'));
    expect(link).not.toContain(' ');
  });
});
