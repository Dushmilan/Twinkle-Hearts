/**
 * Unit Tests for Order Service
 * Tests the core business logic of order management
 */
import { createOrder, getOrderById, getUserOrders } from '../../../src/services/orderService.js';
import { testPrisma } from '../../helpers/testDbManager.js';
import { createProduct, createUser } from '../../helpers/factories.js';

describe('Order Service', () => {
  beforeEach(async () => {
    await testPrisma.orderItem.deleteMany({});
    await testPrisma.order.deleteMany({});
    await testPrisma.product.deleteMany({});
    await testPrisma.user.deleteMany({});
  });

  describe('createOrder', () => {
    it('should create an order with items successfully', async () => {
      const user = await createUser({ email: 'order-test-1@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-001', price: 2999, stock: 10 });

      const order = await createOrder({
        userId: user.id,
        customerName: 'John Doe',
        customerPhone: '+919876543210',
        items: [
          {
            productId: product.id,
            quantity: 2,
            currentPrice: Number(product.price),
            productName: 'Test Product',
          },
        ],
      });

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.userId).toBe(user.id);
      expect(order.customerName).toBe('John Doe');
      expect(order.subtotal).toBe(5998);
      expect(order.tax).toBe(1079.64);
      expect(order.total).toBe(7077.64);
      expect(order.status).toBe('PENDING_WHATSAPP_CONFIRMATION');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe(product.id);
      expect(order.items[0].quantity).toBe(2);

      // Verify stock was deducted
      const updatedProduct = await testPrisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.stock).toBe(8);
    });

    it('should create an order with multiple items', async () => {
      const user = await createUser({ email: 'order-test-2@example.com' });
      const product1 = await createProduct({ sku: 'TEST-ORDER-SVC-002', price: 4999, stock: 10 });
      const product2 = await createProduct({ sku: 'TEST-ORDER-SVC-003', price: 1999, stock: 10 });

      const order = await createOrder({
        userId: user.id,
        customerName: 'Jane Smith',
        customerPhone: '+919876543211',
        items: [
          { productId: product1.id, quantity: 1, currentPrice: Number(product1.price), productName: 'Product 1' },
          { productId: product2.id, quantity: 2, currentPrice: Number(product2.price), productName: 'Product 2' },
        ],
      });

      expect(order.items).toHaveLength(2);
      expect(order.subtotal).toBe(8997);

      // Verify both stocks were deducted
      const p1 = await testPrisma.product.findUnique({ where: { id: product1.id } });
      const p2 = await testPrisma.product.findUnique({ where: { id: product2.id } });
      expect(p1?.stock).toBe(9);
      expect(p2?.stock).toBe(8);
    });

    it('should fail if stock is insufficient', async () => {
      const user = await createUser({ email: 'order-test-3@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-004', price: 2999, stock: 1 });

      await expect(
        createOrder({
          userId: user.id,
          customerName: 'Test',
          customerPhone: '+919876543210',
          items: [
            { productId: product.id, quantity: 5, currentPrice: Number(product.price), productName: 'Test' },
          ],
        })
      ).rejects.toThrow();

      // Stock should not have been deducted
      const updatedProduct = await testPrisma.product.findUnique({ where: { id: product.id } });
      expect(updatedProduct?.stock).toBe(1);
    });

    it('should fail atomically when one item is out of stock', async () => {
      const user = await createUser({ email: 'order-test-4@example.com' });
      const product1 = await createProduct({ sku: 'TEST-ORDER-SVC-005', price: 1000, stock: 10 });
      const product2 = await createProduct({ sku: 'TEST-ORDER-SVC-006', price: 2000, stock: 1 });

      await expect(
        createOrder({
          userId: user.id,
          customerName: 'Test',
          customerPhone: '+919876543210',
          items: [
            { productId: product1.id, quantity: 1, currentPrice: Number(product1.price), productName: 'P1' },
            { productId: product2.id, quantity: 5, currentPrice: Number(product2.price), productName: 'P2' },
          ],
        })
      ).rejects.toThrow();

      // Neither stock should have been deducted (atomic rollback)
      const p1 = await testPrisma.product.findUnique({ where: { id: product1.id } });
      const p2 = await testPrisma.product.findUnique({ where: { id: product2.id } });
      expect(p1?.stock).toBe(10);
      expect(p2?.stock).toBe(1);
    });
  });

  describe('getOrderById', () => {
    it('should return an order with items', async () => {
      const user = await createUser({ email: 'order-test-5@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-007', price: 2999, stock: 10 });
      const createdOrder = await createOrder({
        userId: user.id,
        customerName: 'Get Order Test',
        customerPhone: '+919876543210',
        items: [
          { productId: product.id, quantity: 1, currentPrice: Number(product.price), productName: 'Test Product' },
        ],
      });

      const order = await getOrderById(createdOrder.id, user.id);

      expect(order).toBeDefined();
      expect(order?.id).toBe(createdOrder.id);
      expect(order?.items).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      const order = await getOrderById('non-existent-id', 'user-id');
      expect(order).toBeNull();
    });

    it('should return null if order belongs to different user', async () => {
      const user1 = await createUser({ email: 'order-owner@example.com' });
      const user2 = await createUser({ email: 'order-other@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-008', price: 1000, stock: 10 });
      const order = await createOrder({
        userId: user1.id,
        customerName: 'Owner',
        customerPhone: '+919876543210',
        items: [{ productId: product.id, quantity: 1, currentPrice: 1000, productName: 'Test' }],
      });

      const result = await getOrderById(order.id, user2.id);
      expect(result).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      const user = await createUser({ email: 'order-test-6@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-009', price: 2999, stock: 10 });

      await createOrder({
        userId: user.id,
        customerName: 'User Orders Test',
        customerPhone: '+919876543210',
        items: [{ productId: product.id, quantity: 1, currentPrice: Number(product.price), productName: 'Test' }],
      });

      const result = await getUserOrders(user.id, 1, 20);

      expect((result as any).orders).toHaveLength(1);
      expect((result as any).pagination.total).toBe(1);
    });

    it('should handle pagination', async () => {
      const user = await createUser({ email: 'order-test-7@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-010', price: 2999, stock: 100 });

      for (let i = 0; i < 5; i++) {
        await createOrder({
          userId: user.id,
          customerName: `Order ${i}`,
          customerPhone: '+919876543210',
          items: [{ productId: product.id, quantity: 1, currentPrice: Number(product.price), productName: 'Test' }],
        });
      }

      const result = await getUserOrders(user.id, 1, 2);

      expect((result as any).orders).toHaveLength(2);
      expect((result as any).pagination.total).toBe(5);
      expect((result as any).pagination.totalPages).toBe(3);
    });
  });
});
