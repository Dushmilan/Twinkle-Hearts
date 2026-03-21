/**
 * Test setup - runs before each test file
 */
import { cleanDatabase, seedDatabase } from './helpers/db.js';

// Clean database before each test file
beforeAll(async () => {
  await cleanDatabase();
  await seedDatabase();
});

// Clean database after each test file
afterAll(async () => {
  await cleanDatabase();
});

// Mock console.warn to reduce noise during tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    // Only show warnings that contain 'error' (case insensitive)
    if (args.some(arg => typeof arg === 'string' && arg.toLowerCase().includes('error'))) {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
