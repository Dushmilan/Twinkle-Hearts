import { Prisma } from '@prisma/client';
import testPrisma from './db.js';

/**
 * Product factory - creates a product with customizable attributes
 */
export async function createProduct(overrides: Partial<Prisma.ProductCreateInput> = {}) {
  const product = await testPrisma.product.create({
    data: {
      name: `Test Product ${Date.now()}`,
      description: 'Test product description',
      price: 1999,
      stock: 50,
      sku: `TEST-${Date.now()}`,
      category: 'Test',
      images: [],
      isActive: true,
      ...overrides,
    },
  });
  return product;
}

/**
 * User factory - creates a user with customizable attributes
 */
export async function createUser(overrides: Partial<Prisma.UserCreateInput> = {}) {
  const user = await testPrisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isActive: true,
      ...overrides,
    },
  });
  return user;
}

/**
 * Order factory - creates an order with items
 */
export async function createOrder(overrides: {
  userId?: string | null;
  customerName?: string;
  customerPhone?: string;
  status?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
    productName: string;
  }>;
} = {}) {
  const customerName = overrides.customerName || 'Test Customer';
  const customerPhone = overrides.customerPhone || '+919876543210';
  const items = overrides.items || [];

  const order = await testPrisma.order.create({
    data: {
      userId: overrides.userId || null,
      customerName,
      customerPhone,
      status: (overrides.status as any) || 'PENDING_WHATSAPP_CONFIRMATION',
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      tax: items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.18,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.18,
      priceSnapshot: items.map(item => ({
        productId: item.productId,
        priceAtOrder: item.price,
      })),
      items: items.length > 0 ? {
        create: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      } : undefined,
      ...overrides,
    },
    include: {
      items: true,
    },
  });

  return order;
}

/**
 * Create a complete order with fresh products
 */
export async function createCompleteOrder(orderOverrides: any = {}, productOverrides: any = {}) {
  const product = await createProduct(productOverrides);
  
  const order = await createOrder({
    items: [{
      productId: product.id,
      quantity: 2,
      price: Number(product.price),
      productName: product.name,
    }],
    ...orderOverrides,
  });

  return { order, product };
}
