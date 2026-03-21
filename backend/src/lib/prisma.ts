// Use real Prisma client for tests with actual database
import { PrismaClient } from '@prisma/client';

// Create singleton Prisma client for tests
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
