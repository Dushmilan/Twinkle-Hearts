import { PrismaClient } from '@prisma/client';

// Create a separate Prisma client for testing
export const testPrisma = new PrismaClient({
  log: ['error'], // Only log errors during tests
});

/**
 * Clean all tables in the database (truncate)
 */
export async function cleanDatabase() {
  try {
    // Delete in order to respect foreign key constraints
    await testPrisma.orderItem.deleteMany({});
    await testPrisma.order.deleteMany({});
    await testPrisma.product.deleteMany({});
    await testPrisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Seed database with test data
 */
export async function seedDatabase() {
  try {
    // Create test products
    const products = await Promise.all([
      testPrisma.product.create({
        data: {
          name: 'Classic Heart Necklace',
          description: 'Elegant heart-shaped pendant with delicate chain',
          price: 2999,
          stock: 100,
          sku: 'THN-001',
          category: 'Necklaces',
          images: ['/images/necklace-1.jpg'],
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
          isActive: false,
        },
      }),
    ]);

    return { products };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export default testPrisma;
export { testPrisma };
