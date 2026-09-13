import { getPrismaRepository } from '../lib/prisma.js';
import { CacheKeys, getCacheRepository } from '../lib/cache/index.js';
import { processOrder } from '../lib/order-intake/index.js';
import type { Env } from '../types.js';

export async function createOrder(
  env: Env,
  input: {
    userId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ productId: string; quantity: number; currentPrice: number; productName: string }>;
  }
) {
  const prisma = getPrismaRepository(env.DB);
  const { order } = await processOrder(prisma, env, input);

  await getCacheRepository(env.KV).delete( CacheKeys.userOrders(input.userId));
  console.info(`Order created: ${order.id} - Total: ₹${order.total}`);

  return order;
}

export async function getOrderById(env: Env, orderId: string, userId: string) {
  const prisma = getPrismaRepository(env.DB);
  return prisma.order.findUnique({
    where: { id: orderId, userId },
    include: { items: true },
  });
}

export async function getUserOrders(env: Env, userId: string, page: number = 1, limit: number = 20) {
  const cacheKey = CacheKeys.userOrders(userId);
  const cache = getCacheRepository(env.KV);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const prisma = getPrismaRepository(env.DB);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subtotal: true,
        tax: true,
        total: true,
        status: true,
        items: { select: { productId: true, productName: true, quantity: true, price: true } },
        createdAt: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const result = {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };

  await cache.set(cacheKey, result);
  return result;
}
