/**
 * Test setup - runs before each test file
 * Handles database initialization and cleanup with transaction support
 */

import { testDbManager, testPrisma } from './helpers/testDbManager.js';
import { resetAllMocks, resetTestCounter } from './helpers/mocks.js';

let dbConnected = false;

// Initialize database before all tests (only if DB is accessible)
beforeAll(async () => {
  console.log('Setting up test environment...');
  try {
    await testDbManager.connect();

    // Health check
    const isHealthy = await testDbManager.healthCheck();
    if (!isHealthy) {
      console.warn('Database health check failed. Tests requiring DB will fail.');
      dbConnected = false;
    } else {
      dbConnected = true;
      await testDbManager.cleanDatabase();
      console.log('Test environment ready');
    }
  } catch (error) {
    console.warn('Database unavailable. Tests requiring DB will fail:', (error as Error).message);
    dbConnected = false;
  }
}, 30000); // 30 second timeout for initial setup

// Cleanup after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');
  if (dbConnected) {
    await testDbManager.cleanDatabase();
    await testDbManager.disconnect();
  }
  console.log('Test environment cleaned up');
});

// Clean database before each test and reset mocks (only if connected)
beforeEach(async () => {
  if (dbConnected) {
    await testDbManager.cleanDatabase();
  }
  resetAllMocks();
  resetTestCounter();
});

// Cleanup database after each test (only if connected)
afterEach(async () => {
  if (dbConnected) {
    await testDbManager.cleanDatabase();
  }
  resetAllMocks();
  resetTestCounter();
});

// Export testPrisma for use in tests
export default testPrisma;

// Export dbConnected flag for tests to check
export { dbConnected };

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
