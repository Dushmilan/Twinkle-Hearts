import { describe, it, expect, vi } from 'vitest';
import { reserveStock } from '../stock-reservation.js';
import { StockUnavailableError } from '../../../middleware/errorHandler.js';

describe('reserveStock', () => {
  it('should decrement stock for each item', async () => {
    const tx = {
      product: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await reserveStock(tx as any, [
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 1 },
    ]);

    expect(tx.product.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-2', stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
  });

  it('should throw StockUnavailableError if stock insufficient', async () => {
    const tx = {
      product: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await expect(reserveStock(tx as any, [
      { productId: 'prod-1', quantity: 100 },
    ])).rejects.toThrow(StockUnavailableError);
  });

  it('should stop on first insufficient stock item', async () => {
    const tx = {
      product: {
        updateMany: vi.fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
      },
    };

    await expect(reserveStock(tx as any, [
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-2', quantity: 999 },
      { productId: 'prod-3', quantity: 1 },
    ])).rejects.toThrow(StockUnavailableError);

    expect(tx.product.updateMany).toHaveBeenCalledTimes(2);
  });

  it('should do nothing for empty items', async () => {
    const tx = {
      product: {
        updateMany: vi.fn(),
      },
    };

    await reserveStock(tx as any, []);

    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });
});
