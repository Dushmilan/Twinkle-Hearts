import type { PrismaRepository } from '../repositories/prisma-repository.js';
import { BadRequestError, StockUnavailableError } from '../../middleware/errorHandler.js';
import { isServiceCategory } from '../order-intake/types.js';

export interface HydratedOrderItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
  stockAvailable: number;
  category: string | null;
}

export interface HydratedCartItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  inStock: boolean;
}

export async function hydrateOrderItems(
  prisma: PrismaRepository,
  items: Array<{ productId: string; quantity: number; price?: number }>
): Promise<HydratedOrderItem[]> {
  const productIds = items.map(item => item.productId);
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
      category: true,
    },
  });

  const productMap = new Map<string, { price: number; name: string; stock: number; category: string | null }>(
    products.map(p => [p.id, {
      price: Number(p.price),
      name: p.name,
      stock: p.stock,
      category: p.category ?? null,
    }])
  );

  const validated: HydratedOrderItem[] = [];
  const outOfStock: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new BadRequestError(`Product ${item.productId} not found or inactive`);
    }

    if (!isServiceCategory(product.category) && product.stock < item.quantity) {
      outOfStock.push(
        `${product.name}: Only ${product.stock} available, but ${item.quantity} requested`
      );
    } else {
      validated.push({
        productId: item.productId,
        quantity: item.quantity,
        currentPrice: product.price,
        frontendPrice: item.price,
        productName: product.name,
        stockAvailable: product.stock,
        category: product.category,
      });
    }
  }

  if (outOfStock.length > 0) {
    throw new StockUnavailableError(outOfStock.join('; '));
  }

  return validated;
}

export async function hydrateCartItems(
  prisma: PrismaRepository,
  items: Array<{ productId: string; quantity: number; price?: number }>
): Promise<HydratedCartItem[]> {
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, price: true, stock: true, category: true },
  });

  const productMap = new Map<string, { price: number; stock: number; category: string | null }>(
    products.map(p => [p.id, { price: Number(p.price), stock: p.stock, category: p.category ?? null }])
  );

  return items.map(item => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      currentPrice: product?.price || 0,
      inStock: product ? (isServiceCategory(product.category) || product.stock >= item.quantity) : false,
    };
  });
}
