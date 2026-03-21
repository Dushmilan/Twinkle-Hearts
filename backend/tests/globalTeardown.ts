/**
 * Global test teardown - runs once after all tests
 */
import { cleanDatabase } from './helpers/db.js';

export default async function globalTeardown() {
  try {
    console.log('Cleaning up test environment...');
    
    // Clean all test data
    await cleanDatabase();
    
    console.log('Test environment cleaned up');
  } catch (error) {
    console.error('Global teardown failed:', error);
    throw error;
  }
}
