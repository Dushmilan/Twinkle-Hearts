import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export interface PrismaRepository {
  user: Prisma.UserDelegate;
  product: Prisma.ProductDelegate;
  order: Prisma.OrderDelegate;
  session: Prisma.SessionDelegate;
  address: Prisma.AddressDelegate;
  wishlist: Prisma.WishlistDelegate;
  orderItem: Prisma.OrderItemDelegate;
  adminLog: Prisma.AdminLogDelegate;
  $transaction: <T>(fn: (tx: PrismaRepository) => Promise<T>) => Promise<T>;
}

function wrapClient(client: PrismaClient): PrismaRepository {
  return {
    user: client.user,
    product: client.product,
    order: client.order,
    session: client.session,
    address: client.address,
    wishlist: client.wishlist,
    orderItem: client.orderItem,
    adminLog: client.adminLog,
    $transaction: <T>(fn: (tx: PrismaRepository) => Promise<T>) =>
      client.$transaction((tx: any) => fn(wrapClient(tx))),
  };
}

let repoInstance: PrismaRepository | null = null;

export function getPrismaRepository(db: D1Database): PrismaRepository {
  if (repoInstance) return repoInstance;
  const adapter = new PrismaD1(db);
  const client = new PrismaClient({ adapter });
  repoInstance = wrapClient(client);
  return repoInstance;
}
