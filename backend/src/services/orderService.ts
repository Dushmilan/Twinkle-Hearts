import { getPrisma } from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheDelete, CACHE_TTL, CacheKeys } from '../lib/cache.js';
import { BadRequestError, StockUnavailableError } from '../middleware/errorHandler.js';
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
  const { userId, customerName, customerPhone, items } = input;

  const subtotal = items.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);
  const taxRate = parseFloat(env.TAX_RATE || '0.18');
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = subtotal + tax;

  const prisma = getPrisma(env.DB);

  const order = await prisma.$transaction(async (tx: any) => {
    for (const item of items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (result.count === 0) {
        throw new StockUnavailableError(`Insufficient stock for product ${item.productId}`);
      }
    }

    return tx.order.create({
      data: {
        userId,
        customerName,
        customerPhone,
        subtotal,
        tax,
        total,
        status: 'PENDING_WHATSAPP_CONFIRMATION',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.currentPrice,
          })),
        },
        priceSnapshot: JSON.stringify(items.map((item) => ({
          productId: item.productId,
          priceAtOrder: item.currentPrice,
        }))),
      },
      include: { items: true },
    });
  });

  await cacheDelete(env.KV, CacheKeys.userOrders(userId));
  console.info(`Order created: ${order.id} - Total: ₹${total}`);

  return order;
}

export async function getOrderById(env: Env, orderId: string, userId: string) {
  const prisma = getPrisma(env.DB);
  return prisma.order.findUnique({
    where: { id: orderId, userId },
    include: { items: true },
  });
}

export async function getUserOrders(env: Env, userId: string, page: number = 1, limit: number = 20) {
  const cacheKey = CacheKeys.userOrders(userId);
  const cached = await cacheGet(env.KV, cacheKey);
  if (cached) return cached;

  const prisma = getPrisma(env.DB);
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

  await cacheSet(env.KV, cacheKey, result, CACHE_TTL.USER_ORDERS);
  return result;
}
