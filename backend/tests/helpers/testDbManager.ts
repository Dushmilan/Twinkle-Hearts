/**
 * Test Database Manager
 * Singleton database manager for test isolation and reliability
 */

import { PrismaClient } from '@prisma/client';

const TEST_DB_TIMEOUT = 10000; // 10 seconds
const TEST_DB_RETRIES = 3;
const CLEANUP_ORDER = [
  'orderItem',
  'order',
  'wishlist',
  'address',
  'session',
  'adminLog',
  'product',
  'user',
] as const;

type TableName = (typeof CLEANUP_ORDER)[number];

/**
 * Test database manager class for reliable test isolation
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private prisma: PrismaClient;
  private isConnected = false;
  private cleanupInProgress = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
        },
      },
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  /**
   * Get Prisma client instance
   */
  get client(): PrismaClient {
    return this.prisma;
  }

  /**
   * Connect to database with retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    await this.withRetry(async () => {
      await this.prisma.$connect();
      this.isConnected = true;
    }, 'Database connection');
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await this.prisma.$disconnect();
    this.isConnected = false;
  }

  /**
   * Clean database with transaction and retry logic
   */
  async cleanDatabase(): Promise<void> {
    if (this.cleanupInProgress) {
      // Wait for ongoing cleanup to finish
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.cleanDatabase();
    }

    this.cleanupInProgress = true;

    try {
      await this.withRetry(async () => {
        // Use a transaction to ensure atomicity
        await this.prisma.$transaction(async tx => {
          for (const table of CLEANUP_ORDER) {
            try {
              await (tx as any)[table].deleteMany({});
            } catch (error) {
              // Log but continue - table might not exist yet
              console.error(`Error cleaning table ${table}:`, error);
            }
          }
        });
      }, 'Database cleanup');
    } finally {
      this.cleanupInProgress = false;
    }
  }

  /**
   * Execute function with retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    retries = TEST_DB_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          console.warn(
            `${operation} failed (attempt ${attempt}/${retries}), retrying...`,
            error
          );
          // Exponential backoff
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw new Error(`${operation} failed after ${retries} attempts: ${lastError?.message ?? 'Unknown error'}`);
  }

  /**
   * Check database connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const testDbManager = TestDatabaseManager.getInstance();

// Export Prisma client for backward compatibility
export const testPrisma = testDbManager.client;
export default testPrisma;
