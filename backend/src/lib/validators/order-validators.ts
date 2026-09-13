import type { PrismaRepository } from '../repositories/prisma-repository.js';
import { BadRequestError } from '../../middleware/errorHandler.js';

export interface HydratedOrderItem {
  productId: string;
  quantity: number;
  currentPrice: number;
  frontendPrice?: number;
  productName: string;
}

export interface HydratedCartItem {
  productId: string;
  quantity: number;
  currentPrice: number;
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
    },
  });

  const productMap = new Map<string, { price: number; name: string }>(
    products.map(p => [p.id, {
      price: Number(p.price),
      name: p.name,
    }])
  );

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new BadRequestError(`Product ${item.productId} not found or inactive`);
    }

    return {
      productId: item.productId,
      quantity: item.quantity,
      currentPrice: product.price,
      frontendPrice: item.price,
      productName: product.name,
    };
  });
}

export async function hydrateCartItems(
  prisma: PrismaRepository,
  items: Array<{ productId: string; quantity: number; price?: number }>
): Promise<HydratedCartItem[]> {
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, price: true },
  });

  const productMap = new Map<string, { price: number }>(
    products.map(p => [p.id, { price: Number(p.price) }])
  );

  return items.map(item => {
    const product = productMap.get(item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      currentPrice: product?.price || 0,
    };
  });
}
