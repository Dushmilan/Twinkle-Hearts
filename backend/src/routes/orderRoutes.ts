import { Router } from 'express';
import { validateOrder } from '../middleware/validation.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import { createOrder, getOrderById, confirmOrder } from '../services/orderService.js';

const router = Router();

/**
 * POST /api/orders/create
 * Create a new order from cart
 */
router.post('/create', orderRateLimit, validateOrder, async (req, res, next) => {
  try {
    const { validatedItems, customerName, customerPhone } = req.body;
    const userId = req.headers['x-user-id'] as string | undefined;

    // Calculate totals server-side
    const subtotal = validatedItems.reduce(
      (sum: number, item: any) => sum + item.currentPrice * item.quantity,
      0
    );
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    // Create order
    const order = await createOrder({
      userId: userId || null,
      customerName,
      customerPhone,
      items: validatedItems,
      subtotal,
      tax,
      total,
    });

    // Generate WhatsApp message
    const whatsappMessage = formatOrderMessage(order);
    const whatsappDeepLink = `https://wa.me/${process.env.WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    res.json({
      orderId: order.id,
      status: order.status,
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      whatsappDeepLink,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        items: order.items,
        customerName: order.customerName,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/orders/:id/confirm
 * Confirm order (called after WhatsApp confirmation)
 */
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { whatsappMessageId } = req.body;
    const order = await confirmOrder(req.params.id, whatsappMessageId);

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

/**
 * Format order message for WhatsApp
 */
function formatOrderMessage(order: any): string {
  const itemsList = order.items
    .map((item: any, idx: number) => `${idx + 1}. ${item.productName} x${item.quantity} - ₹${item.price}`)
    .join('\n');

  return `
🛒 *NEW ORDER REQUEST*
━━━━━━━━━━━━━━━━━━━━
*Order ID:* ${order.id.slice(0, 8).toUpperCase()}
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
━━━━━━━━━━━━━━━━━━━━
*Items:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ₹${order.subtotal}
*Tax (18%):* ₹${order.tax}
*TOTAL:* ₹${order.total}
━━━━━━━━━━━━━━━━━━━━
*Please confirm this order.*
  `.trim();
}

export default router;
