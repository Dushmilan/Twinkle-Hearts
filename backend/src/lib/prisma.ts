import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

let prisma: PrismaClient | null = null;

export function getPrisma(db: D1Database): PrismaClient {
  if (prisma) return prisma;
  const adapter = new PrismaD1(db);
  prisma = new PrismaClient({ adapter });
  return prisma;
}

export default getPrisma;
