import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { cacheDelete, cacheSet, cacheGet, CACHE_TTL, CacheKeys } from '../lib/cache.js';

interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    quantity: number;
    currentPrice: number;
    productName: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Create a new order for WhatsApp confirmation
 */
export const createOrder = async (input: CreateOrderInput): Promise<any> => {
  const { userId, customerName, customerPhone, items, subtotal, tax, total } = input;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      userId,
      customerName,
      customerPhone,
      subtotal,
      tax,
      total,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.currentPrice,
        })),
      },
      priceSnapshot: items.map(item => ({
        productId: item.productId,
        priceAtOrder: item.currentPrice,
      })),
    },
    include: {
      items: true,
    },
  });

  // Invalidate user's orders cache
  await cacheDelete(CacheKeys.userOrders(userId));

  logger.info(`Order created: ${order.id} - Total: ₹${total}`);

  return order;
};

/**
 * Get order by ID (with ownership check)
 */
export const getOrderById = async (orderId: string, userId: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: {
      items: true,
    },
  });

  return order;
};

/**
 * Get user's orders with caching
 */
export const getUserOrders = async (userId: string, page: number = 1, limit: number = 20) => {
  const cacheKey = CacheKeys.userOrders(userId);

  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

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
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            price: true,
          },
        },
        createdAt: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const result = {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await cacheSet(cacheKey, result, CACHE_TTL.USER_ORDERS);

  return result;
};
