import { Hono } from 'hono';
import type { Context } from 'hono';
import { validateOrder } from '../middleware/validation.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { createOrder, getOrderById, getUserOrders } from '../services/orderService.js';
import { formatOrderMessage, buildWhatsAppDeepLink } from '../lib/order-intake/index.js';
import {
  IdempotencyStore,
  hashRequestBody,
  type IdempotencyCache,
  type IdempotencyRecord,
} from '../lib/idempotency/idempotency-store.js';
import type { Env, Variables } from '../types.js';

type OrderEnv = { Bindings: Env; Variables: Variables };
type OrderContext = Context<OrderEnv>;
const router = new Hono<OrderEnv>();

// Same-isolate guard for concurrent double-submits sharing one Idempotency-Key.
// The map check-and-set in the handler runs synchronously before any await,
// so the first request becomes leader and followers wait for it. KV `pending`
// polling below covers the cross-isolate case.
const inflightOrders = new Map<string, Promise<void>>();

function idempotencyCache(kv: KVNamespace): IdempotencyCache {
  return {
    get: (key) => kv.get(key, 'text'),
    put: (key, value, ttlSeconds) => kv.put(key, value, { expirationTtl: ttlSeconds }),
    delete: (key) => kv.delete(key),
  };
}

async function waitForSettledResult(
  store: IdempotencyStore,
  userId: string,
  key: string,
): Promise<IdempotencyRecord | null> {
  const deadline = Date.now() + 2000;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const record = await store.get(userId, key);
    if (record && !record.pending) return record;
    if (Date.now() >= deadline) return record;
  }
}

function waitForInflight(settled: Promise<void>): Promise<boolean> {
  return Promise.race([
    settled.then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
  ]);
}

async function createOrderWithIdempotency(
  c: OrderContext,
  store: IdempotencyStore,
  userId: string,
  idempotencyKey: string,
): Promise<Response> {
  const validatedItems = c.get('validatedItems');
  const customerName = c.get('customerName');
  const customerPhone = c.get('customerPhone');

  const requestHash = hashRequestBody(await c.req.text());
  const existing = await store.get(userId, idempotencyKey);
  if (existing) {
    if (existing.requestHash !== requestHash) {
      return c.json({ error: 'Idempotency key was already used with a different request payload' }, 422);
    }
    if (!existing.pending) {
      if (existing.orderId === undefined) {
        return c.json({ error: 'Stored idempotency record is incomplete; retry with a new Idempotency-Key' }, 409);
      }
      return c.json({ orderId: existing.orderId }, 200, { 'Idempotent-Replayed': 'true' });
    }
    const settled = await waitForSettledResult(store, userId, idempotencyKey);
    if (settled && !settled.pending && settled.orderId !== undefined) {
      return c.json({ orderId: settled.orderId }, 200, { 'Idempotent-Replayed': 'true' });
    }
    return c.json({ error: 'Order is still being processed; retry with the same Idempotency-Key' }, 409);
  }

  await store.save(userId, idempotencyKey, {
    requestHash,
    statusCode: 200,
    pending: true,
  });

  try {
    const order: any = await createOrder(c.env, {
      userId,
      customerName,
      customerPhone,
      items: validatedItems,
    });

    const whatsappMessage = formatOrderMessage(order);
    const whatsappDeepLink = buildWhatsAppDeepLink(c.env.WHATSAPP_BUSINESS_NUMBER, whatsappMessage);

    const responseBody = {
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
    };

    await store.save(userId, idempotencyKey, {
      requestHash,
      orderId: String(order.id),
      statusCode: 200,
      pending: false,
    });

    return c.json(responseBody);
  } catch (error) {
    await store.delete(userId, idempotencyKey);
    throw error;
  }
}

router.use('*', authenticate);

router.post('/create', orderRateLimit, validateOrder, async (c) => {
  const user = c.get('user');

  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey) {
    const store = new IdempotencyStore(idempotencyCache(c.env.KV));
    const scope = `${user.userId}:${idempotencyKey}`;
    for (;;) {
      const ongoing = inflightOrders.get(scope);
      if (!ongoing) {
        let done!: () => void;
        inflightOrders.set(scope, new Promise<void>((resolve) => { done = resolve; }));
        try {
          return await createOrderWithIdempotency(c, store, user.userId, idempotencyKey);
        } finally {
          done();
          inflightOrders.delete(scope);
        }
      }
      const settledInTime = await waitForInflight(ongoing);
      if (!settledInTime) {
        return c.json({ error: 'Another request with this Idempotency-Key is still being processed' }, 409);
      }
    }
  }

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
