import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, StockUnavailableError } from './errorHandler.js';

// Cart item schema (what frontend sends)
// Accept both UUID and simple IDs for demo compatibility
const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().optional(), // Frontend price (for reference only, not trusted)
});

// Order creation schema
export const orderCreationSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Cart cannot be empty'),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Valid phone number required'),
});

export type OrderCreationInput = z.infer<typeof orderCreationSchema>;

// Validated cart item (after database validation)
export interface ValidatedCartItem {
  productId: string;
  quantity: number;
  currentPrice: number; // From database (authoritative)
  frontendPrice?: number; // From frontend (for audit only)
  productName: string;
  stockAvailable: number;
}

/**
 * Validate order input and fetch current prices/stock from database
 * CRITICAL: Never trust frontend prices - always fetch from database
 */
export const validateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input structure
    const input = orderCreationSchema.parse(req.body);

    // Extract product IDs
    const productIds = input.items.map(item => item.productId);

    // Fetch current products from database
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      },
    });

    // Build lookup maps
    const productMap = new Map(
      products.map(p => [p.id, { 
        price: p.price.toNumber(), 
        name: p.name,
        stock: p.stock 
      }])
    );

    // Validate each item and build validated cart
    const validatedItems: ValidatedCartItem[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found or inactive`);
      }

      if (product.stock < item.quantity) {
        throw new StockUnavailableError(
          item.productId,
          product.stock,
          item.quantity
        );
      }

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        currentPrice: product.price,
        frontendPrice: item.price,
        productName: product.name,
        stockAvailable: product.stock,
      });
    }

    // Attach validated items to request
    req.body.validatedItems = validatedItems;
    req.body.customerName = input.customerName;
    req.body.customerPhone = input.customerPhone;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      return next(new BadRequestError(messages));
    }
    next(error);
  }
};

/**
 * Validate cart sync request
 */
export const validateCartSync = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Cart cannot be empty');
    }

    // Validate structure
    const parsed = z.array(cartItemSchema).parse(items);
    
    // Fetch current prices
    const productIds = parsed.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, stock: true },
    });

    const productMap = new Map(
      products.map(p => [p.id, { 
        price: p.price.toNumber(), 
        stock: p.stock 
      }])
    );

    // Build validated cart
    const validatedItems = parsed.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        currentPrice: product?.price || 0,
        inStock: product ? product.stock >= item.quantity : false,
      };
    });

    req.body.validatedItems = validatedItems;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      return next(new BadRequestError(messages));
    }
    next(error);
  }
};
