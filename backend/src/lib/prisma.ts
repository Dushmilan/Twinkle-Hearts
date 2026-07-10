import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { PrismaRepository } from './repositories/prisma-repository.js';
import { getPrismaRepository } from './repositories/prisma-repository.js';

let prisma: PrismaClient | null = null;

/** @deprecated Use getPrismaRepository(env.DB) instead */
export function getPrisma(db: D1Database): PrismaClient {
  if (prisma) return prisma;
  const adapter = new PrismaD1(db);
  prisma = new PrismaClient({ adapter });
  return prisma;
}

export default getPrisma;
export { getPrismaRepository };
export type { PrismaRepository };
