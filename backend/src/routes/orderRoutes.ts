import { Hono } from 'hono';
import type { Context } from 'hono';
import { validateOrder } from '../middleware/validation.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { createOrder, getOrderById, getUserOrders } from '../services/orderService.js';
import { formatOrderMessage, buildWhatsAppDeepLink } from '../lib/order-intake/index.js';
import {
  IdempotencyStore,
  hashIdempotencyPayload,
  IDEMPOTENCY_PENDING_TTL_SECONDS,
  type IdempotencyCache,
  type IdempotencyOrderResponse,
  type IdempotencyRecord,
} from '../lib/idempotency/idempotency-store.js';
import type { Env, Variables } from '../types.js';

type OrderEnv = { Bindings: Env; Variables: Variables };
type OrderContext = Context<OrderEnv>;
type CreatedOrder = Awaited<ReturnType<typeof createOrder>>;
const router = new Hono<OrderEnv>();

// Same-isolate guard for concurrent double-submits sharing one Idempotency-Key.
// The map check-and-set in the handler runs synchronously before any await,
// so the first request becomes leader and followers wait for it. KV `pending`
// polling below covers the cross-isolate case.
const inflightOrders = new Map<string, Promise<void>>();

// Idempotency-Key format guard: opaque client token, bounded so it is safe to
// embed in the KV key. Rejects empty / overlong / garbage keys with 400.
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

function idempotencyCache(kv: KVNamespace): IdempotencyCache {
  return {
    get: (key) => kv.get(key, 'text'),
    put: (key, value, ttlSeconds) => kv.put(key, value, { expirationTtl: ttlSeconds }),
    delete: (key) => kv.delete(key),
  };
}

async function getWithReread(
  store: IdempotencyStore,
  userId: string,
  key: string,
): Promise<IdempotencyRecord | null> {
  // Cloudflare KV is eventually consistent: a record written seconds ago may
  // briefly read as null. Re-read on a bounded backoff before assuming no
  // prior request exists, or a lagging read creates a duplicate order.
  const delaysMs = [300, 700];
  for (;;) {
    const record = await store.get(userId, key);
    if (record !== null) return record;
    const delay = delaysMs.shift();
    if (delay === undefined) return null;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
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
    // Null means the marker vanished mid-wait (leader failed and deleted it):
    // return immediately so the caller retries as leader instead of 409ing.
    if (record === null) return null;
    if (!record.pending) return record;
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

  // Canonical hash over the validated payload: no second body read (validation
  // already consumed the body), and re-serialized retries replay correctly.
  const requestHash = hashIdempotencyPayload({ items: validatedItems, customerName, customerPhone });
  const existing = await getWithReread(store, userId, idempotencyKey);
  if (existing) {
    if (existing.requestHash !== requestHash) {
      return c.json({ error: 'Idempotency key was already used with a different request payload' }, 422);
    }
    if (!existing.pending) {
      if (existing.orderId === undefined || existing.response === undefined) {
        return c.json({ error: 'Stored idempotency record is incomplete; retry with a new Idempotency-Key' }, 409);
      }
      return c.json(existing.response, 200, { 'Idempotent-Replayed': 'true' });
    }
    const settled = await waitForSettledResult(store, userId, idempotencyKey);
    if (settled !== null) {
      if (!settled.pending && settled.response !== undefined) {
        return c.json(settled.response, 200, { 'Idempotent-Replayed': 'true' });
      }
      return c.json({ error: 'Order is still being processed; retry with the same Idempotency-Key' }, 409);
    }
    // Marker vanished mid-wait (leader failed and deleted it): fall through,
    // save a fresh pending marker and create below.
  }

  await store.save(userId, idempotencyKey, {
    requestHash,
    statusCode: 200,
    pending: true,
  }, IDEMPOTENCY_PENDING_TTL_SECONDS);

  try {
    const order: CreatedOrder = await createOrder(c.env, {
      userId,
      customerName,
      customerPhone,
      items: validatedItems,
    });

    const whatsappMessage = formatOrderMessage(order);
    const whatsappDeepLink = buildWhatsAppDeepLink(c.env.WHATSAPP_BUSINESS_NUMBER, whatsappMessage);

    const responseBody: IdempotencyOrderResponse = {
      orderId: String(order.id),
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      total: Number(order.total),
      whatsappDeepLink,
      createdAt: new Date(order.createdAt).toISOString(),
    };

    await store.save(userId, idempotencyKey, {
      requestHash,
      orderId: responseBody.orderId,
      statusCode: 200,
      pending: false,
      response: responseBody,
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
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return c.json({ error: 'Invalid Idempotency-Key format' }, 400);
    }
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

  const order: CreatedOrder = await createOrder(c.env, {
    userId: user.userId,
    customerName,
    customerPhone,
    items: validatedItems,
  });

  const whatsappMessage = formatOrderMessage(order);
  const whatsappDeepLink = buildWhatsAppDeepLink(c.env.WHATSAPP_BUSINESS_NUMBER, whatsappMessage);

  return c.json({
    orderId: order.id,
    items: order.items.map((item) => ({
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
