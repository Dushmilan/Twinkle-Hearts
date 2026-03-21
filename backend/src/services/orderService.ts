import prisma from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import cron from 'node-cron';

interface CreateOrderInput {
  userId: string | null;
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
export const createOrder = async (input: CreateOrderInput) => {
  const { userId, customerName, customerPhone, items, subtotal, tax, total } = input;

  // Calculate expiration time (15 minutes from now)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

  logger.info(`Order created: ${order.id} - Total: ₹${total}`);

  return order;
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });
};

/**
 * Confirm order after WhatsApp verification
 */
export const confirmOrder = async (orderId: string, whatsappMessageId?: string) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      whatsappMessageId,
    },
    include: {
      items: true,
    },
  });

  logger.info(`Order confirmed: ${order.id}`);

  return order;
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, reason?: string) => {
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
export const expirePendingOrders = async () => {
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
