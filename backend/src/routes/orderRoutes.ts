import { Hono } from 'hono';
import { validateOrder } from '../middleware/validation.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { createOrder, getOrderById, getUserOrders } from '../services/orderService.js';
import { formatOrderMessage, buildWhatsAppDeepLink } from '../lib/order-intake/index.js';
import type { Env, Variables } from '../types.js';

type OrderEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<OrderEnv>();

router.use('*', authenticate);

router.post('/create', orderRateLimit, validateOrder, async (c) => {
  const user = c.get('user');
  const validatedItems = c.get('validatedItems');
  const customerName = c.get('customerName');
  const customerPhone = c.get('customerPhone');

  const order: any = await createOrder(c.env, {
    userId: user.userId,
    customerName,
    customerPhone,
    items: validatedItems,
  });

  const whatsappMessage = formatOrderMessage(order);
  const whatsappDeepLink = buildWhatsAppDeepLink(c.env.WHATSAPP_BUSINESS_NUMBER, whatsappMessage);

  return c.json({
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
});

router.get('/', async (c) => {
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');

  const result = await getUserOrders(c.env, user.userId, page, limit);
  return c.json({ success: true, data: result });
});

router.get('/:id', async (c) => {
  const user = c.get('user');
  const order = await getOrderById(c.env, c.req.param('id'), user.userId);

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  return c.json({
    order: {
      id: order.id,
      total: Number(order.total),
      items: order.items,
      customerName: order.customerName,
      createdAt: order.createdAt,
    },
  });
});

export default router;
