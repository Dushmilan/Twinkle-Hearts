/**
 * Integration Tests for Orders API
 * Tests order creation and retrieval endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createProduct, createOrder, createUser } from '../helpers/factories.js';

const app = createTestApp();

describe('Orders API', () => {
  describe('POST /api/orders/create', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-API-001' });

      const orderData = {
        items: [
          { productId: product.id, quantity: 2, price: Number(product.price) },
        ],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.orderId).toBeDefined();
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productId).toBe(product.id);
      expect(response.body.subtotal).toBe(Number(product.price) * 2);
      expect(response.body.tax).toBeCloseTo(response.body.subtotal * 0.18, 2);
      expect(response.body.total).toBeCloseTo(response.body.subtotal * 1.18, 2);
      expect(response.body.whatsappDeepLink).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should create an order with multiple items', async () => {
      // Arrange
      const product1 = await createProduct({ sku: 'TEST-ORDER-API-002' });
      const product2 = await createProduct({ sku: 'TEST-ORDER-API-003' });

      const orderData = {
        items: [
          { productId: product1.id, quantity: 1, price: Number(product1.price) },
          { productId: product2.id, quantity: 2, price: Number(product2.price) },
        ],
        customerName: 'Jane Smith',
        customerPhone: '+919876543211',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      const expectedSubtotal = Number(product1.price) + (Number(product2.price) * 2);
      expect(response.body.subtotal).toBe(expectedSubtotal);
    });

    it('should reject order with empty items', async () => {
      // Arrange
      const orderData = {
        items: [],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject order with invalid customer name', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-API-004' });

      const orderData = {
        items: [{ productId: product.id, quantity: 1 }],
        customerName: 'J', // Too short
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject order with invalid phone number', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-API-005' });

      const orderData = {
        items: [{ productId: product.id, quantity: 1 }],
        customerName: 'John Doe',
        customerPhone: '123', // Invalid
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject order with non-existent product', async () => {
      // Arrange
      const orderData = {
        items: [{ productId: 'non-existent-id', quantity: 1 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject order when product is inactive', async () => {
      // Arrange
      const product = await createProduct({
        sku: 'TEST-ORDER-API-006',
        isActive: false,
      });

      const orderData = {
        items: [{ productId: product.id, quantity: 1 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject order when stock is insufficient', async () => {
      // Arrange
      const product = await createProduct({
        sku: 'TEST-ORDER-API-007',
        stock: 1,
      });

      const orderData = {
        items: [{ productId: product.id, quantity: 5 }], // More than stock
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order details', async () => {
      // Arrange
      const user = await createUser({ email: 'get-order-test@example.com' });
      const order = await createOrder({
        userId: user.id,
        customerName: 'Get Order Test',
        customerPhone: '+919876543210',
      });

      // Act
      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${user.email}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(order.id);
    });

    it('should return 404 for non-existent order', async () => {
      // Act
      const response = await request(app)
        .get('/api/orders/non-existent-id')
        .set('Authorization', 'Bearer test@example.com');

      // Assert
      expect(response.status).toBe(404);
    });

    it('should reject access to order owned by another user', async () => {
      // Arrange
      const otherUser = await createUser({ email: 'other-user@example.com' });
      const order = await createOrder({
        userId: otherUser.id,
        customerName: 'Other User Order',
      });

      // Act - try to access with different user
      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer test@example.com`);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/orders', () => {
    it('should return user orders', async () => {
      // Arrange
      const user = await createUser({ email: 'orders-list@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-LIST-001' });

      await createOrder({
        userId: user.id,
        customerName: 'User Order',
        items: [
          {
            productId: product.id,
            quantity: 1,
            price: Number(product.price),
            productName: 'Test Product',
          },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${user.email}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('should return empty array for user with no orders', async () => {
      // Arrange
      const user = await createUser({ email: 'no-orders@example.com' });

      // Act
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${user.email}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.orders).toEqual([]);
    });

    it('should handle pagination', async () => {
      // Arrange
      const user = await createUser({ email: 'pagination-test@example.com' });
      const product = await createProduct({ sku: 'TEST-ORDER-PAGE-001' });

      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        await createOrder({
          userId: user.id,
          customerName: `Order ${i}`,
          items: [
            {
              productId: product.id,
              quantity: 1,
              price: Number(product.price),
              productName: 'Test Product',
            },
          ],
        });
      }

      // Act
      const response = await request(app)
        .get('/api/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${user.email}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(5);
    });
  });
});
