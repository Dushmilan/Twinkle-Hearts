/**
 * Test setup - runs before each test file
 * Handles database initialization and cleanup with transaction support
 */

import { testDbManager, testPrisma } from './helpers/testDbManager.js';
import { resetAllMocks, resetTestCounter } from './helpers/mocks.js';

// Initialize database before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');
  await testDbManager.connect();

  // Health check
  const isHealthy = await testDbManager.healthCheck();
  if (!isHealthy) {
    throw new Error('Database health check failed. Ensure your test database is running.');
  }

  await testDbManager.cleanDatabase();
  console.log('Test environment ready');
}, 30000); // 30 second timeout for initial setup

// Cleanup after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');
  await testDbManager.cleanDatabase();
  await testDbManager.disconnect();
  console.log('Test environment cleaned up');
});

// Clean database before each test and reset mocks
beforeEach(async () => {
  await testDbManager.cleanDatabase();
  resetAllMocks();
  resetTestCounter();
});

// Cleanup database after each test
afterEach(async () => {
  await testDbManager.cleanDatabase();
  resetAllMocks();
  resetTestCounter();
});

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
