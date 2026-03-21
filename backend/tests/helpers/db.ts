/**
 * Database Export
 * Re-exports the singleton Prisma client from testDbManager
 * Use this import for database access in tests
 */

// Re-export from the singleton manager to avoid multiple PrismaClient instances
export { testPrisma, testDbManager } from './testDbManager.js';
export { testPrisma as default } from './testDbManager.js';
