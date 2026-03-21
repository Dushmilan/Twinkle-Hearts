// In-memory mock data for development demo (no database required)
// Private Commercial Project - Confidential

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface MockOrder {
  id: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  priceSnapshot: Array<{
    productId: string;
    priceAtOrder: number;
  }>;
  whatsappMessageId?: string;
  whatsappStatus?: string;
  createdAt: string;
  expiresAt?: string;
  confirmedAt?: string;
  updatedAt: string;
}

// Sample products for demo
export const products: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'Classic Heart Necklace',
    description: 'Elegant heart-shaped pendant with sterling silver chain. Perfect for everyday wear or special occasions.',
    price: 2999,
    stock: 50,
    sku: 'THN-001',
    category: 'Necklaces',
    images: ['/images/products/heart-necklace-1.jpg', '/images/products/heart-necklace-2.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Rose Gold Bracelet',
    description: 'Delicate rose gold plated bracelet with adjustable chain. Hypoallergenic and tarnish-resistant.',
    price: 1499,
    stock: 75,
    sku: 'THB-001',
    category: 'Bracelets',
    images: ['/images/products/rose-bracelet-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'Crystal Drop Earrings',
    description: 'Stunning crystal drop earrings with secure butterfly backs. Lightweight and comfortable for all-day wear.',
    price: 899,
    stock: 100,
    sku: 'THE-001',
    category: 'Earrings',
    images: ['/images/products/crystal-earrings-1.jpg', '/images/products/crystal-earrings-2.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Infinity Ring Set',
    description: 'Set of 3 stackable rings with infinity symbols. Available in silver, gold, and rose gold finishes.',
    price: 1299,
    stock: 60,
    sku: 'THR-001',
    category: 'Rings',
    images: ['/images/products/infinity-rings-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    name: 'Pearl Pendant Necklace',
    description: 'Freshwater pearl pendant on a delicate gold chain. Timeless elegance for any occasion.',
    price: 3499,
    stock: 30,
    sku: 'THN-002',
    category: 'Necklaces',
    images: ['/images/products/pearl-necklace-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    name: 'Charm Bracelet',
    description: 'Silver charm bracelet with 5 interchangeable charms. Add your own charms to personalize.',
    price: 2199,
    stock: 45,
    sku: 'THB-002',
    category: 'Bracelets',
    images: ['/images/products/charm-bracelet-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    name: 'Stud Earring Set',
    description: 'Set of 6 pairs of minimalist stud earrings in various designs. Perfect for everyday wear.',
    price: 699,
    stock: 120,
    sku: 'THE-002',
    category: 'Earrings',
    images: ['/images/products/stud-set-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-008',
    name: 'Birthstone Ring',
    description: 'Elegant birthstone ring with your choice of gemstone. Available in all 12 birthstones.',
    price: 1799,
    stock: 40,
    sku: 'THR-002',
    category: 'Rings',
    images: ['/images/products/birthstone-ring-1.jpg'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// In-memory orders store
export const orders: MockOrder[] = [];

// Helper functions
export function findProduct(id: string): MockProduct | undefined {
  return products.find(p => p.id === id);
}

export function findProducts(ids: string[]): MockProduct[] {
  return products.filter(p => ids.includes(p.id));
}

export function createOrder(orderData: Omit<MockOrder, 'id' | 'createdAt' | 'updatedAt'>): MockOrder {
  const order: MockOrder = {
    ...orderData,
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

export function findOrder(id: string): MockOrder | undefined {
  return orders.find(o => o.id === id);
}

export function updateOrder(id: string, updates: Partial<MockOrder>): MockOrder | undefined {
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  
  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return orders[index];
}

export function expirePendingOrders(): number {
  const now = new Date();
  let expired = 0;
  
  for (const order of orders) {
    if (order.status === 'PENDING_WHATSAPP_CONFIRMATION' && order.expiresAt) {
      if (new Date(order.expiresAt) < now) {
        order.status = 'EXPIRED';
        order.updatedAt = new Date().toISOString();
        expired++;
      }
    }
  }
  
  return expired;
}
