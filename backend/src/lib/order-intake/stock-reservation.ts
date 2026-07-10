import { StockUnavailableError } from '../../middleware/errorHandler.js';
import type { PrismaRepository } from '../prisma.js';

export async function reserveStock(
  tx: PrismaRepository,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    const result = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });

    if (result.count === 0) {
      throw new StockUnavailableError(`Insufficient stock for product ${item.productId}`);
    }
  }
}
