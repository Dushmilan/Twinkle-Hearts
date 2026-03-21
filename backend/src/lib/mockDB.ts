// Mock database adapter for development demo (no database required)
// Private Commercial Project - Confidential

import { 
  products, 
  orders, 
  findProduct, 
  findProducts, 
  createOrder, 
  findOrder, 
  updateOrder,
  expirePendingOrders as expireOrders
} from './mockData.js';

// Mock Decimal class to mimic Prisma Decimal
class MockDecimal {
  constructor(private value: number) {}
  toNumber() { return this.value; }
  toString() { return this.value.toString(); }
  valueOf() { return this.value; }
}

export const mockDB = {
  // Product operations
  product: {
    findMany: async (options: { 
      where?: { 
        id?: { in?: string[] }; 
        isActive?: boolean;
        OR?: Array<{ name: { contains: string; mode?: string }; description?: { contains: string; mode?: string } }>;
        category?: string;
      };
      select?: Record<string, boolean>;
      skip?: number;
      take?: number;
      orderBy?: Record<string, string>;
    }) => {
      let result = [...products];
      
      // Apply filters
      if (options.where) {
        if (options.where.isActive !== undefined) {
          result = result.filter(p => p.isActive === options.where.isActive);
        }
        if (options.where.id?.in) {
          result = result.filter(p => options.where.id!.in!.includes(p.id));
        }
        if (options.where.OR) {
          const searchTerms = options.where.OR.map(or => {
            if (or.name?.contains) return or.name.contains.toLowerCase();
            if (or.description?.contains) return or.description.contains.toLowerCase();
            return '';
          }).filter(Boolean);
          
          result = result.filter(p => 
            searchTerms.some(term => 
              p.name.toLowerCase().includes(term) || 
              p.description.toLowerCase().includes(term)
            )
          );
        }
        if (options.where.category) {
          result = result.filter(p => p.category === options.where.category);
        }
      }
      
      // Apply pagination
      const skip = options.skip || 0;
      const take = options.take || result.length;
      result = result.slice(skip, skip + take);
      
      // Apply select and convert price to MockDecimal
      if (options.select) {
        result = result.map(p => {
          const selected: any = {};
          Object.keys(options.select!).forEach(key => {
            if (options.select![key] && key in p) {
              selected[key] = key === 'price' ? new MockDecimal(p.price) : (p as any)[key];
            }
          });
          return selected;
        });
      }
      
      return result;
    },

    findUnique: async (options: { where: { id: string }; select?: Record<string, boolean> }) => {
      const product = findProduct(options.where.id);
      
      if (!product) return null;
      
      if (options.select) {
        const selected: any = {};
        Object.keys(options.select).forEach(key => {
          if (options.select![key] && key in product) {
            selected[key] = key === 'price' ? new MockDecimal(product.price) : (product as any)[key];
          }
        });
        return selected;
      }
      
      // Convert price to MockDecimal
      return { ...product, price: new MockDecimal(product.price) };
    },

    count: async (options: { 
      where?: { 
        isActive?: boolean;
        OR?: Array<{ name: { contains: string }; description?: { contains: string } }>;
        category?: string;
      } 
    }) => {
      let result = [...products];
      
      if (options.where) {
        if (options.where.isActive !== undefined) {
          result = result.filter(p => p.isActive === options.where.isActive);
        }
        if (options.where.OR) {
          const searchTerms = options.where.OR.map(or => {
            if (or.name?.contains) return or.name.contains.toLowerCase();
            if (or.description?.contains) return or.description.contains.toLowerCase();
            return '';
          }).filter(Boolean);
          
          result = result.filter(p => 
            searchTerms.some(term => 
              p.name.toLowerCase().includes(term) || 
              p.description.toLowerCase().includes(term)
            )
          );
        }
      }
      
      return result.length;
    },
  },

  // Order operations
  order: {
    create: async (options: { data: any; include?: Record<string, boolean> }) => {
      const order = createOrder({
        userId: options.data.userId,
        customerName: options.data.customerName,
        customerPhone: options.data.customerPhone,
        status: options.data.status,
        subtotal: options.data.subtotal,
        tax: options.data.tax,
        total: options.data.total,
        items: options.data.items.create.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        priceSnapshot: options.data.priceSnapshot,
        expiresAt: options.data.expiresAt,
      });
      
      if (options.include?.items) {
        return { ...order, items: order.items };
      }
      
      return order;
    },

    findUnique: async (options: { where: { id: string }; include?: Record<string, boolean> }) => {
      const order = findOrder(options.where.id);
      
      if (!order) return null;
      
      if (options.include?.items) {
        return { ...order, items: order.items };
      }
      
      return order;
    },

    update: async (options: { where: { id: string }; data: any; include?: Record<string, boolean> }) => {
      const order = updateOrder(options.where.id, options.data);
      
      if (!order) return null;
      
      if (options.include?.items) {
        return { ...order, items: order.items };
      }
      
      return order;
    },

    updateMany: async (options: { where: { status: string; expiresAt: { lt: Date } }; data: { status: string } }) => {
      const expired = expireOrders();
      return { count: expired };
    },
  },

  // Disconnect (no-op for mock)
  $disconnect: async () => {},
};

export default mockDB;
