/**
 * Unit Tests for Order Service
 * Tests the core business logic of order management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder, getOrderById, getUserOrders } from '../../src/services/orderService.js';
import { testPrisma, resetDatabase } from '../../setup.js';
import { createProduct, createUser } from '../helpers/factories.js';

describe('Order Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

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
            currentPrice: 2999,
            productName: 'Test Product',
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
      expect(order.subtotal).toBe(5998);
      expect(order.tax).toBe(1079.64);
      expect(order.total).toBe(7077.64);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe(product.id);
      expect(order.items[0].quantity).toBe(2);
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
            currentPrice: 4999,
            productName: 'Product 1',
          },
          {
            productId: product2.id,
            quantity: 2,
            currentPrice: 1999,
            productName: 'Product 2',
          },
        ],
        subtotal: 8997,
        tax: 1619.46,
        total: 10616.46,
      };

      // Act
      const order = await createOrder(input);

      // Assert
      expect(order.items).toHaveLength(2);
      expect(order.total).toBe(10616.46);
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
        customerPhone: '+919876543210',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: 2999,
            productName: 'Test Product',
          },
        ],
        subtotal: 2999,
        tax: 539.82,
        total: 3538.82,
      });

      // Act
      const order = await getOrderById(createdOrder.id, user.id);

      // Assert
      expect(order).toBeDefined();
      expect(order?.id).toBe(createdOrder.id);
      expect(order?.items).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      // Act
      const order = await getOrderById('non-existent-id', 'user-id');

      // Assert
      expect(order).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-5@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-006' });

      await createOrder({
        userId: user.id,
        customerName: 'User Orders Test',
        customerPhone: '+919876543210',
        items: [
          {
            productId: product.id,
            quantity: 1,
            currentPrice: 2999,
            productName: 'Test Product',
          },
        ],
        subtotal: 2999,
        tax: 539.82,
        total: 3538.82,
      });

      // Act
      const result = await getUserOrders(user.id, 1, 20);

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should handle pagination', async () => {
      // Arrange
      const user = await createUser({ email: 'order-test-6@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-SVC-007' });

      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        await createOrder({
          userId: user.id,
          customerName: `Order ${i}`,
          customerPhone: '+919876543210',
          items: [
            {
              productId: product.id,
              quantity: 1,
              currentPrice: 2999,
              productName: 'Test Product',
            },
          ],
          subtotal: 2999,
          tax: 539.82,
          total: 3538.82,
        });
      }

      // Act - get first page with limit 2
      const result = await getUserOrders(user.id, 1, 2);

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });
  });
});
