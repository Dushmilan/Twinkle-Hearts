import type { Context, Next } from 'hono';
import { z } from 'zod';
import { getPrismaRepository } from '../lib/prisma.js';
import { hydrateOrderItems, hydrateCartItems } from '../lib/validators/index.js';
import { BadRequestError } from './errorHandler.js';
import type { Env, Variables } from '../types.js';

type ValContext = { Bindings: Env; Variables: Variables };

const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive').max(999, 'Maximum quantity per item is 999'),
  price: z.number().optional(),
});

export const orderCreationSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10-15 digits, optionally prefixed with +'),
});

export async function validateOrder(c: Context<ValContext>, next: Next) {
  try {
    const body = await c.req.json();
    const input = orderCreationSchema.parse(body);
    const prisma = getPrismaRepository(c.env.DB);

    const validatedItems = await hydrateOrderItems(prisma, input.items);

    c.set('validatedItems', validatedItems);
    c.set('customerName', input.customerName);
    c.set('customerPhone', input.customerPhone);

    await next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      throw new BadRequestError(messages);
    }
    throw error;
  }
}

export async function validateCartSync(c: Context<ValContext>, next: Next) {
  try {
    const body = await c.req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Cart cannot be empty');
    }

    const parsed = z.array(cartItemSchema).parse(items);
    const prisma = getPrismaRepository(c.env.DB);

    const validatedItems = await hydrateCartItems(prisma, parsed);

    c.set('validatedItems', validatedItems as any);
    await next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      throw new BadRequestError(messages);
    }
    throw error;
  }
}
