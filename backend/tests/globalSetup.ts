/**
 * Global test setup - runs once before all tests
 */
import { initializeDatabase, cleanDatabase, seedDatabase } from './helpers/db.js';

export default async function globalSetup() {
  try {
    console.log('Setting up test environment...');
    
    // Initialize database (ensure schema exists)
    await initializeDatabase();
    
    // Clean any existing data
    await cleanDatabase();
    
    // Seed with test data
    await seedDatabase();
    
    console.log('Test environment ready');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  }
}
