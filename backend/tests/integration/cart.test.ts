/**
 * Integration Tests for Cart API
 * Tests cart synchronization and validation
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import { createProduct } from '../helpers/factories.js';

const app = createTestApp();

describe('Cart API', () => {
  describe('POST /api/cart/sync', () => {
    it('should sync cart and return current prices', async () => {
      // Arrange
      const product = await createProduct({ });

      const cartItems = [
        { productId: product.id, quantity: 2, price: Number(product.price) },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productId).toBe(product.id);
      expect(response.body.items[0].currentPrice).toBe(Number(product.price));
      expect(response.body.items[0].inStock).toBe(true);
      expect(response.body.syncedAt).toBeDefined();
    });

    it('should reject empty cart', async () => {
      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: [] });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject cart without items array', async () => {
      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should mark item as out of stock when quantity exceeds available stock', async () => {
      // Arrange
      const product = await createProduct({ stock: 5 });

      const cartItems = [
        { productId: product.id, quantity: 10 }, // More than stock
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items[0].inStock).toBe(false);
      expect(response.body.items[0].currentPrice).toBe(Number(product.price));
    });

    it('should handle multiple cart items', async () => {
      // Arrange
      const product1 = await createProduct({ });
      const product2 = await createProduct({ });
      const product3 = await createProduct({ });

      const cartItems = [
        { productId: product1.id, quantity: 1, price: Number(product1.price) },
        { productId: product2.id, quantity: 2, price: Number(product2.price) },
        { productId: product3.id, quantity: 1, price: Number(product3.price) },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items[0].productId).toBe(product1.id);
      expect(response.body.items[1].productId).toBe(product2.id);
      expect(response.body.items[2].productId).toBe(product3.id);
    });

    it('should handle non-existent products gracefully', async () => {
      // Arrange
      const cartItems = [
        { productId: 'non-existent-id', quantity: 1, price: 1999 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items[0].currentPrice).toBe(0);
      expect(response.body.items[0].inStock).toBe(false);
    });

    it('should handle mix of valid and invalid products', async () => {
      // Arrange
      const validProduct = await createProduct({ });

      const cartItems = [
        { productId: validProduct.id, quantity: 1, price: Number(validProduct.price) },
        { productId: 'non-existent-id', quantity: 1, price: 999 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].productId).toBe(validProduct.id);
      expect(response.body.items[0].inStock).toBe(true);
      expect(response.body.items[1].productId).toBe('non-existent-id');
      expect(response.body.items[1].inStock).toBe(false);
    });

    it('should reject invalid quantity (zero)', async () => {
      // Arrange
      const product = await createProduct({ });

      const cartItems = [
        { productId: product.id, quantity: 0 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid quantity (negative)', async () => {
      // Arrange
      const product = await createProduct({ });

      const cartItems = [
        { productId: product.id, quantity: -5 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle inactive products (should not return them)', async () => {
      // Arrange
      const inactiveProduct = await createProduct({
        isActive: false,
      });

      const cartItems = [
        { productId: inactiveProduct.id, quantity: 1 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.items[0].currentPrice).toBe(0);
      expect(response.body.items[0].inStock).toBe(false);
    });

    it('should return syncedAt timestamp', async () => {
      // Arrange
      const product = await createProduct({ });

      const beforeSync = Date.now();
      const cartItems = [
        { productId: product.id, quantity: 1 },
      ];

      // Act
      const response = await request(app)
        .post('/api/cart/sync')
        .send({ items: cartItems });

      const afterSync = Date.now();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.syncedAt).toBeDefined();
      const syncedAt = new Date(response.body.syncedAt).getTime();
      expect(syncedAt).toBeGreaterThanOrEqual(beforeSync);
      expect(syncedAt).toBeLessThanOrEqual(afterSync);
    });
  });
});
