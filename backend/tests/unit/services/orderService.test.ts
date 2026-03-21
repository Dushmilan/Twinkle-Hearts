/**
 * Unit Tests for Order Service
 * Tests the core business logic of order management
 */

import {
  createOrder,
  getOrderById,
  confirmOrder,
  cancelOrder,
  expirePendingOrders,
} from '../../src/services/orderService.js';
import testPrisma from '../helpers/db.js';
import { createProduct, createUser } from '../helpers/factories.js';

describe('Order Service', () => {
  describe('createOrder', () => {
    it('should create an order with items successfully', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-1@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-001' });
      const input = {
        userId: user.id,
        customerName: 'John Doe',
        customerPhone: '+919876543210',
        items: [
          {
            productId: product.id,
            quantity: 2,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 5998,
        tax: 1079.64,
        total: 7077.64,
      };

      // Act
      const order = await createOrder(input);

      // Assert
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.userId).toBe(user.id);
      expect(order.customerName).toBe('John Doe');
      expect(order.customerPhone).toBe('+919876543210');
      expect(order.status).toBe('PENDING_WHATSAPP_CONFIRMATION');
      expect(order.subtotal).toBe(5998);
      expect(order.tax).toBe(1079.64);
      expect(order.total).toBe(7077.64);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe(product.id);
      expect(order.items[0].quantity).toBe(2);
      expect(order.expiresAt).toBeDefined();
    });

    it('should create an order with multiple items', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-2@example.com' });
      const product1 = await createProduct({ sku: 'TEST-ORDER-SVC-002' });
      const product2 = await createProduct({ sku: 'TEST-ORDER-SVC-003' });
      const input = {
        userId: user.id,
        customerName: 'Jane Smith',
        customerPhone: '+919876543211',
        items: [
          {
            productId: product1.id,
            quantity: 1,
            currentPrice: Number(product1.price),
            productName: product1.name,
          },
          {
            productId: product2.id,
            quantity: 3,
            currentPrice: Number(product2.price),
            productName: product2.name,
          },
        ],
        subtotal: 7996,
        tax: 1439.28,
        total: 9435.28,
      };

      // Act
      const order = await createOrder(input);

      // Assert
      expect(order.items).toHaveLength(2);
      expect(order.total).toBe(9435.28);
    });

    it('should set expiration time to 15 minutes from creation', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-3@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-004' });
      const beforeCreate = new Date();

      // Act
      const order = await createOrder({
        userId: user.id,
        customerName: 'Test User',
        customerPhone: '+919876543210',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 1999,
        tax: 359.82,
        total: 2358.82,
      });

      const afterCreate = new Date();
      const expiresAt = new Date(order.expiresAt!);

      // Assert
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() + 15 * 60 * 1000
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime() + 15 * 60 * 1000
      );
    });
  });

  describe('getOrderById', () => {
    it('should return an order with items', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-4@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-005' });
      const createdOrder = await createOrder({
        userId: user.id,
        customerName: 'Get Order Test',
        customerPhone: '+919876543212',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 1999,
        tax: 359.82,
        total: 2358.82,
      });

      // Act
      const order = await getOrderById(createdOrder.id);

      // Assert
      expect(order).toBeDefined();
      expect(order?.id).toBe(createdOrder.id);
      expect(order?.items).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      // Act
      const order = await getOrderById('non-existent-id');

      // Assert
      expect(order).toBeNull();
    });
  });

  describe('confirmOrder', () => {
    it('should confirm a pending order', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-5@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-006' });
      const order = await createOrder({
        userId: user.id,
        customerName: 'Confirm Test',
        customerPhone: '+919876543213',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 1999,
        tax: 359.82,
        total: 2358.82,
      });

      // Act
      const confirmedOrder = await confirmOrder(order.id, user.id, 'wamid.test123');

      // Assert
      expect(confirmedOrder.status).toBe('CONFIRMED');
      expect(confirmedOrder.confirmedAt).toBeDefined();
      expect(confirmedOrder.whatsappMessageId).toBe('wamid.test123');
    });

    it('should confirm an order without whatsapp message id', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-6@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-007' });
      const order = await createOrder({
        userId: user.id,
        customerName: 'Confirm Test 2',
        customerPhone: '+919876543214',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 1999,
        tax: 359.82,
        total: 2358.82,
      });

      // Act
      const confirmedOrder = await confirmOrder(order.id, user.id);

      // Assert
      expect(confirmedOrder.status).toBe('CONFIRMED');
      expect(confirmedOrder.confirmedAt).toBeDefined();
      expect(confirmedOrder.whatsappMessageId).toBeUndefined();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-7@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-008' });
      const order = await createOrder({
        userId: user.id,
        customerName: 'Cancel Test',
        customerPhone: '+919876543215',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: Number(product.price),
            productName: product.name,
          },
        ],
        subtotal: 1999,
        tax: 359.82,
        total: 2358.82,
      });

      // Act
      const cancelledOrder = await cancelOrder(order.id, 'Customer requested');

      // Assert
      expect(cancelledOrder.status).toBe('CANCELLED');
    });
  });

  describe('expirePendingOrders', () => {
    it('should expire orders past their expiration time', async () => {
      // Arrange - create an order with past expiration
      const user = await createUser({ email: 'order-test-8@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-009' });
      const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago

      await testPrisma.order.create({
        data: {
          userId: user.id,
          customerName: 'Expire Test',
          customerPhone: '+919876543216',
          status: 'PENDING_WHATSAPP_CONFIRMATION',
          subtotal: 1999,
          tax: 359.82,
          total: 2358.82,
          expiresAt: pastDate,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              quantity: 1,
              price: Number(product.price),
            },
          },
          priceSnapshot: [],
        },
      });

      // Act
      const expiredCount = await expirePendingOrders();

      // Assert
      expect(expiredCount).toBeGreaterThanOrEqual(1);

      // Verify the order status changed
      const updatedOrder = await testPrisma.order.findFirst({
        where: { customerPhone: '+919876543216', customerName: 'Expire Test' },
      });
      expect(updatedOrder?.status).toBe('EXPIRED');
    });

    it('should not expire orders that are not pending', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-9@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-010' });
      const pastDate = new Date(Date.now() - 60000).toISOString();

      await testPrisma.order.create({
        data: {
          userId: user.id,
          customerName: 'Not Expire Test',
          customerPhone: '+919876543217',
          status: 'CONFIRMED', // Not pending
          subtotal: 1999,
          tax: 359.82,
          total: 2358.82,
          expiresAt: pastDate,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              quantity: 1,
              price: Number(product.price),
            },
          },
          priceSnapshot: [],
        },
      });

      // Act
      const expiredCount = await expirePendingOrders();

      // Assert - should not count the confirmed order
      const confirmedOrder = await testPrisma.order.findFirst({
        where: { customerPhone: '+919876543217', customerName: 'Not Expire Test' },
      });
      expect(confirmedOrder?.status).toBe('CONFIRMED');
    });
  });
});
