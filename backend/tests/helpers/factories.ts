import { Prisma } from '@prisma/client';
import { testPrisma } from './db.js';
import {
  TEST_PASSWORD,
  TEST_USER_NAME,
  TEST_USER_PHONE,
  TEST_USER_ROLE,
  TEST_PRODUCT_NAME,
  TEST_PRODUCT_DESCRIPTION,
  TEST_PRODUCT_PRICE,
  TEST_PRODUCT_STOCK,
  TEST_PRODUCT_CATEGORY,
  TEST_ORDER_CUSTOMER_NAME,
  TEST_ORDER_QUANTITY_DEFAULT,
} from './constants.js';

/**
 * Unique ID generator for test data
 * Uses a counter instead of Date.now() for more reliable uniqueness
 */
let testCounter = 0;
export function generateTestUniqueId(prefix: string = 'test'): string {
  testCounter++;
  return `${prefix}-${process.pid}-${testCounter}`;
}

/**
 * Reset the test counter (called before each test)
 */
export function resetTestCounter(): void {
  testCounter = 0;
}

/**
 * Product factory - creates a product with customizable attributes
 */
export async function createProduct(overrides: Partial<Prisma.ProductCreateInput> = {}) {
  const product = await testPrisma.product.create({
    data: {
      name: `${TEST_PRODUCT_NAME} ${generateTestUniqueId()}`,
      description: TEST_PRODUCT_DESCRIPTION,
      price: TEST_PRODUCT_PRICE,
      stock: TEST_PRODUCT_STOCK,
      category: TEST_PRODUCT_CATEGORY,
      images: [],
      isFeatured: false,
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
      email: `${generateTestUniqueId()}@example.com`,
      name: TEST_USER_NAME,
      phone: TEST_USER_PHONE,
      role: TEST_USER_ROLE,
      isActive: true,
      ...overrides,
    },
  });
  return user;
}

/**
 * Order item interface for type-safe order creation
 */
export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
}

/**
 * Order factory overrides interface
 */
export interface OrderFactoryOverrides {
  userId?: string | null;
  customerName?: string;
  customerPhone?: string;
  items?: OrderItemInput[];
}

/**
 * Order factory - creates an order with items
 */
export async function createOrder(overrides: OrderFactoryOverrides = {}) {
  const customerName = overrides.customerName || TEST_ORDER_CUSTOMER_NAME;
  const customerPhone = overrides.customerPhone || TEST_USER_PHONE;
  const items = overrides.items || [];

  // Create a user if userId is not provided
  let userId = overrides.userId;
  if (userId === undefined || userId === null) {
    const user = await testPrisma.user.create({
      data: {
        email: `order-test-${Date.now()}@example.com`,
        name: TEST_USER_NAME,
        phone: customerPhone,
        role: TEST_USER_ROLE,
        isActive: true,
      },
    });
    userId = user.id;
  }

  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = itemTotal * 0.18;
  const total = itemTotal + tax;

  const orderData: Prisma.OrderCreateInput = {
    customerName,
    customerPhone,
    subtotal: itemTotal,
    tax,
    total,
    priceSnapshot: items.map(item => ({
      productId: item.productId,
      priceAtOrder: item.price,
    })),
    user: {
      connect: { id: userId },
    },
  };

  // Only add items if there are any
  if (items.length > 0) {
    orderData.items = {
      create: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }

  const order = await testPrisma.order.create({
    data: orderData,
    include: {
      items: true,
    },
  });

  return order;
}

/**
 * Create a complete order with fresh products
 */
export async function createCompleteOrder(orderOverrides: OrderFactoryOverrides = {}, productOverrides: Partial<Prisma.ProductCreateInput> = {}) {
  const product = await createProduct(productOverrides);

  const order = await createOrder({
    items: [{
      productId: product.id,
      quantity: TEST_ORDER_QUANTITY_DEFAULT,
      price: Number(product.price),
      productName: product.name,
    }],
    ...orderOverrides,
  });

  return { order, product };
}
