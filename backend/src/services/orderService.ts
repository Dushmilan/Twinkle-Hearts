import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import cron from 'node-cron';
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
 * Create a new order in PENDING_WHATSAPP_CONFIRMATION state
 */
export const createOrder = async (input: CreateOrderInput): Promise<any> => {
  const { userId, customerName, customerPhone, items, subtotal, tax, total } = input;

  // Calculate expiration time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Create order with items
  const order = await prisma.order.create({
    data: {
      userId,
      customerName,
      customerPhone,
      status: 'PENDING_WHATSAPP_CONFIRMATION',
      subtotal,
      tax,
      total,
      expiresAt,
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
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            price: true,
          },
        },
      },
      select: {
        id: true,
        status: true,
        total: true,
        items: true,
        createdAt: true,
        confirmedAt: true,
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

/**
 * Confirm order after WhatsApp verification
 */
export const confirmOrder = async (orderId: string, userId: string, whatsappMessageId?: string): Promise<any> => {
  const order = await prisma.order.update({
    where: { id: orderId, userId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      whatsappMessageId,
    },
    include: {
      items: true,
    },
  });

  // Invalidate cache
  await cacheDelete(CacheKeys.userOrders(userId));

  logger.info(`Order confirmed: ${order.id}`);

  return order;
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, reason?: string): Promise<any> => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
    },
    include: {
      items: true,
    },
  });

  logger.info(`Order cancelled: ${order.id} - Reason: ${reason || 'Not specified'}`);

  return order;
};

/**
 * Expire pending orders (called by cron job)
 */
export const expirePendingOrders = async (): Promise<number> => {
  const result = await prisma.order.updateMany({
    where: {
      status: 'PENDING_WHATSAPP_CONFIRMATION',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  if (result.count > 0) {
    logger.info(`Expired ${result.count} pending orders`);
  }

  return result.count;
};

/**
 * Start cron job to expire pending orders every 5 minutes
 */
export const startOrderExpirationCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await expirePendingOrders();
    } catch (error) {
      logger.error('Error in order expiration cron:', error);
    }
  });

  logger.info('Order expiration cron started (runs every 5 minutes)');
};
