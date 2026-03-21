/**
 * Integration Tests for Orders API
 * Tests order creation, retrieval, and confirmation endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createProduct, createOrder } from '../helpers/factories.js';

const app = createTestApp();

describe('Orders API', () => {
  describe('POST /api/orders/create', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-001' });

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
      expect(response.body.status).toBe('PENDING_WHATSAPP_CONFIRMATION');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productId).toBe(product.id);
      expect(response.body.subtotal).toBe(Number(product.price) * 2);
      expect(response.body.tax).toBeCloseTo(response.body.subtotal * 0.18, 2);
      expect(response.body.total).toBeCloseTo(response.body.subtotal * 1.18, 2);
      expect(response.body.whatsappDeepLink).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should create an order with multiple items', async () => {
      // Arrange
      const product1 = await createProduct({ sku: 'TEST-ORDER-002' });
      const product2 = await createProduct({ sku: 'TEST-ORDER-003' });

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
      const product = await createProduct({ sku: 'TEST-ORDER-004' });

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
      const product = await createProduct({ sku: 'TEST-ORDER-005' });

      const orderData = {
        items: [{ productId: product.id, quantity: 1 }],
        customerName: 'John Doe',
        customerPhone: '123', // Too short
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

    it('should reject order when stock is insufficient', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-006', stock: 2 });

      const orderData = {
        items: [{ productId: product.id, quantity: 10 }], // More than stock
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

    it('should calculate tax and total correctly', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-007', price: 1000 });

      const orderData = {
        items: [{ productId: product.id, quantity: 2, price: 1000 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.subtotal).toBe(2000);
      expect(response.body.tax).toBe(360); // 18% of 2000
      expect(response.body.total).toBe(2360); // 2000 + 360
    });

    it('should set expiration to 15 minutes from creation', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-008' });

      const beforeOrder = Date.now();
      const orderData = {
        items: [{ productId: product.id, quantity: 1 }],
        customerName: 'John Doe',
        customerPhone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/orders/create')
        .send(orderData);

      const afterOrder = Date.now();

      // Assert
      const expiresAt = new Date(response.body.expiresAt).getTime();
      const expectedMin = beforeOrder + (15 * 60 * 1000);
      const expectedMax = afterOrder + (15 * 60 * 1000);
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should generate WhatsApp deep link with mock number', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-ORDER-009' });

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
      expect(response.status).toBe(200);
      expect(response.body.whatsappDeepLink).toContain('wa.me/919999999999'); // Mock number from .env.test
      expect(response.body.whatsappDeepLink).toContain(encodeURIComponent('ORDER'));
    });

    it('should reject order with inactive product', async () => {
      // Arrange
      const inactiveProduct = await createProduct({
        sku: 'TEST-ORDER-010',
        isActive: false,
      });

      const orderData = {
        items: [{ productId: inactiveProduct.id, quantity: 1 }],
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
    it('should return an order by ID', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-GET-ORDER-001' });
      const order = await createOrder({
        customerName: 'Get Order Test',
        customerPhone: '+919876543220',
        items: [{
          productId: product.id,
          quantity: 1,
          price: Number(product.price),
          productName: product.name,
        }],
      });

      // Act
      const response = await request(app).get(`/api/orders/${order.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.order.id).toBe(order.id);
      expect(response.body.order.status).toBe(order.status);
      expect(response.body.order.total).toBe(order.total);
      expect(response.body.order.customerName).toBe('Get Order Test');
    });

    it('should return 404 for non-existent order', async () => {
      // Act
      const response = await request(app).get('/api/orders/non-existent-id');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });

    it('should include order items in response', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-GET-ORDER-002' });
      const order = await createOrder({
        customerName: 'Items Test',
        customerPhone: '+919876543221',
        items: [{
          productId: product.id,
          quantity: 2,
          price: Number(product.price),
          productName: product.name,
        }],
      });

      // Act
      const response = await request(app).get(`/api/orders/${order.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.order.items).toBeDefined();
      expect(response.body.order.items.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/orders/:id/confirm', () => {
    it('should confirm a pending order', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-CONFIRM-ORDER-001' });
      const order = await createOrder({
        customerName: 'Confirm Test',
        customerPhone: '+919876543230',
        status: 'PENDING_WHATSAPP_CONFIRMATION',
        items: [{
          productId: product.id,
          quantity: 1,
          price: Number(product.price),
          productName: product.name,
        }],
      });

      // Act
      const response = await request(app)
        .post(`/api/orders/${order.id}/confirm`)
        .send({ whatsappMessageId: 'wamid.test123' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('CONFIRMED');
      expect(response.body.order.confirmedAt).toBeDefined();
    });

    it('should confirm order without whatsapp message id', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-CONFIRM-ORDER-002' });
      const order = await createOrder({
        customerName: 'Confirm Test 2',
        customerPhone: '+919876543231',
        status: 'PENDING_WHATSAPP_CONFIRMATION',
        items: [{
          productId: product.id,
          quantity: 1,
          price: Number(product.price),
          productName: product.name,
        }],
      });

      // Act
      const response = await request(app)
        .post(`/api/orders/${order.id}/confirm`)
        .send({});

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('CONFIRMED');
    });

    it('should return 404 for non-existent order', async () => {
      // Act
      const response = await request(app)
        .post('/api/orders/non-existent-id/confirm')
        .send({ whatsappMessageId: 'wamid.test' });

      // Assert
      expect(response.status).toBe(404);
    });
  });
});
