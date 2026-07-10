import type { PrismaRepository } from '../prisma.js';
import { computePricing } from './pricing-engine.js';
import { reserveStock } from './stock-reservation.js';
import { formatOrderMessage, buildWhatsAppDeepLink } from './whatsapp-formatter.js';
import type { OrderIntakeInput, OrderIntakeResult } from './types.js';

export async function processOrder(
  prisma: PrismaRepository,
  env: { TAX_RATE?: string; WHATSAPP_BUSINESS_NUMBER: string },
  input: OrderIntakeInput
): Promise<OrderIntakeResult> {
  const { userId, customerName, customerPhone, items } = input;

  const taxRate = parseFloat(env.TAX_RATE || '0.18');
  const pricing = computePricing(items, taxRate);

  const order = await prisma.$transaction(async (tx) => {
    await reserveStock(tx, items);

    return tx.order.create({
      data: {
        userId,
        customerName,
        customerPhone,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        status: 'PENDING_WHATSAPP_CONFIRMATION',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.currentPrice,
          })),
        },
        priceSnapshot: JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            priceAtOrder: item.currentPrice,
          }))
        ),
      },
      include: { items: true },
    });
  });

  const whatsappMessage = formatOrderMessage(order);
  const whatsappDeepLink = buildWhatsAppDeepLink(env.WHATSAPP_BUSINESS_NUMBER, whatsappMessage);

  return { order, whatsappDeepLink };
}
