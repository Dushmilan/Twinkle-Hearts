import { Router } from 'express';
import { validateOrder } from '../middleware/validation.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { createOrder, getOrderById, getUserOrders } from '../services/orderService.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * POST /api/orders/create
 * Create a new order from cart
 * Server-side calculates totals from validated item prices
 */
router.post('/create', orderRateLimit, validateOrder, async (req, res, next) => {
  try {
    const { validatedItems, customerName, customerPhone } = req.body;
    const userId = req.user!.id;

    // Create order (totals calculated server-side in service)
    const order = await createOrder({
      userId,
      customerName,
      customerPhone,
      items: validatedItems,
    });

    // Generate WhatsApp message
    const whatsappMessage = formatOrderMessage(order);
    const whatsappDeepLink = `https://wa.me/${process.env.WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    res.json({
      orderId: order.id,
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      whatsappDeepLink,
      createdAt: order.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 * Get user's order history
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getUserOrders(req.user!.id, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order by ID (only if user owns it)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id, req.user!.id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      order: {
        id: order.id,
        total: Number(order.total),
        items: order.items,
        customerName: order.customerName,
        createdAt: order.createdAt,
      },
    });
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
  `.trim();
}

export default router;
