import type { Context, Next } from 'hono';
import { z } from 'zod';
import { getPrisma } from '../lib/prisma.js';
import { BadRequestError, StockUnavailableError } from './errorHandler.js';
import type { Env, Variables, ValidatedCartItem } from '../types.js';

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
    const prisma = getPrisma(c.env.DB);

    const productIds = input.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      },
    });

    const productMap = new Map<string, { price: number; name: string; stock: number }>(
      products.map(p => [p.id, {
        price: Number(p.price),
        name: p.name,
        stock: p.stock,
      }])
    );

    const validatedItems: ValidatedCartItem[] = [];
    const outOfStockErrors: string[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found or inactive`);
      }

      if (product.stock < item.quantity) {
        outOfStockErrors.push(
          `${product.name}: Only ${product.stock} available, but ${item.quantity} requested`
        );
      } else {
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          currentPrice: product.price,
          frontendPrice: item.price,
          productName: product.name,
          stockAvailable: product.stock,
        });
      }
    }

    if (outOfStockErrors.length > 0) {
      throw new StockUnavailableError(outOfStockErrors.join('; '));
    }

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
    const prisma = getPrisma(c.env.DB);

    const productIds = parsed.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, stock: true },
    });

    const productMap = new Map<string, { price: number; stock: number }>(
      products.map(p => [p.id, { price: Number(p.price), stock: p.stock }])
    );

    const validatedItems = parsed.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        currentPrice: product?.price || 0,
        inStock: product ? product.stock >= item.quantity : false,
      };
    });

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
