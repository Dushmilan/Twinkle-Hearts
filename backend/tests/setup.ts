/**
 * Test setup - runs before each test file
 * Handles database initialization and cleanup
 */

import { PrismaClient } from '@prisma/client';

const testPrisma = new PrismaClient({
  log: ['error'],
});

// Initialize database before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');
  await testPrisma.$connect();
  await cleanDatabase();
  await seedDatabase();
  console.log('Test environment ready');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');
  await cleanDatabase();
  await testPrisma.$disconnect();
  console.log('Test environment cleaned up');
});

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase();
  await seedDatabase();
});

// Clean database after each test
afterEach(async () => {
  await cleanDatabase();
});

/**
 * Clean all tables in the database
 */
async function cleanDatabase() {
  try {
    // Delete in order to respect foreign key constraints
    await testPrisma.orderItem.deleteMany({});
    await testPrisma.order.deleteMany({});
    await testPrisma.wishlist.deleteMany({});
    await testPrisma.address.deleteMany({});
    await testPrisma.session.deleteMany({});
    await testPrisma.adminLog.deleteMany({});
    await testPrisma.product.deleteMany({});
    await testPrisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

/**
 * Seed database with test data
 */
async function seedDatabase() {
  try {
    await Promise.all([
      testPrisma.product.create({
        data: {
          name: 'Classic Heart Necklace',
          description: 'Elegant heart-shaped pendant with delicate chain',
          price: 2999,
          stock: 100,
          sku: 'THN-001',
          category: 'Necklaces',
          images: ['/images/necklace-1.jpg'],
          isFeatured: false,
          isActive: true,
        },
      }),
      testPrisma.product.create({
        data: {
          name: 'Rose Gold Bracelet',
          description: 'Beautiful rose gold plated bracelet',
          price: 1999,
          stock: 50,
          sku: 'THB-001',
          category: 'Bracelets',
          images: ['/images/bracelet-1.jpg'],
          isFeatured: false,
          isActive: true,
        },
      }),
      testPrisma.product.create({
        data: {
          name: 'Diamond Stud Earrings',
          description: 'Sparkling diamond stud earrings',
          price: 4999,
          stock: 25,
          sku: 'THE-001',
          category: 'Earrings',
          images: ['/images/earrings-1.jpg'],
          isFeatured: false,
          isActive: true,
        },
      }),
      testPrisma.product.create({
        data: {
          name: 'Infinity Ring',
          description: 'Sterling silver infinity symbol ring',
          price: 1499,
          stock: 75,
          sku: 'THR-001',
          category: 'Rings',
          images: ['/images/ring-1.jpg'],
          isFeatured: false,
          isActive: true,
        },
      }),
      testPrisma.product.create({
        data: {
          name: 'Inactive Product',
          description: 'This product is not active',
          price: 999,
          stock: 10,
          sku: 'THI-001',
          category: 'Test',
          images: [],
          isFeatured: false,
          isActive: false,
        },
      }),
    ]);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export testPrisma for use in tests
export default testPrisma;

// Mock console.warn to reduce noise
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.toLowerCase().includes('error'))) {
      originalWarn(...args);
    }
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
