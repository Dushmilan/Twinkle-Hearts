/**
 * Integration Tests for Products API
 * Tests the full HTTP request/response cycle for product endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createProduct } from '../helpers/factories.js';

const app = createTestApp();

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('should return paginated list of active products', async () => {
      // Arrange - seed data is already loaded by globalSetup
      // Act
      const response = await request(app).get('/api/products');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should only return active products', async () => {
      // Arrange
      const inactiveProduct = await createProduct({
        sku: 'TEST-INACTIVE-001',
        isActive: false,
      });

      // Act
      const response = await request(app).get('/api/products');

      // Assert
      expect(response.status).toBe(200);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).not.toContain(inactiveProduct.id);
    });

    it('should support pagination', async () => {
      // Act
      const response = await request(app).get('/api/products?page=2&limit=2');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should support search by name', async () => {
      // Arrange
      const searchProduct = await createProduct({
        sku: 'TEST-SEARCH-001',
        name: 'Unique Search Test Product',
      });

      // Act
      const response = await request(app).get('/api/products?search=Unique Search');

      // Assert
      expect(response.status).toBe(200);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).toContain(searchProduct.id);
    });

    it('should support search by description', async () => {
      // Arrange
      const searchProduct = await createProduct({
        sku: 'TEST-SEARCH-002',
        description: 'This has a unique description for testing',
      });

      // Act
      const response = await request(app).get('/api/products?search=unique description');

      // Assert
      expect(response.status).toBe(200);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).toContain(searchProduct.id);
    });

    it('should support filter by category', async () => {
      // Arrange
      const categoryProduct = await createProduct({
        sku: 'TEST-CATEGORY-001',
        category: 'Test Category',
      });

      // Act
      const response = await request(app).get('/api/products?category=Test Category');

      // Assert
      expect(response.status).toBe(200);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).toContain(categoryProduct.id);
    });

    it('should return price as number (not BigInt)', async () => {
      // Act
      const response = await request(app).get('/api/products');

      // Assert
      expect(response.status).toBe(200);
      if (response.body.products.length > 0) {
        expect(typeof response.body.products[0].price).toBe('number');
      }
    });

    it('should return empty array when no products match search', async () => {
      // Act
      const response = await request(app).get('/api/products?search=NonExistentProduct123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single active product', async () => {
      // Arrange
      const product = await createProduct({ sku: 'TEST-SINGLE-001' });

      // Act
      const response = await request(app).get(`/api/products/${product.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.product.id).toBe(product.id);
      expect(response.body.product.name).toBe(product.name);
      expect(response.body.product.price).toBe(Number(product.price));
    });

    it('should return 404 for non-existent product', async () => {
      // Act
      const response = await request(app).get('/api/products/non-existent-id');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });

    it('should return 404 for inactive product', async () => {
      // Arrange
      const inactiveProduct = await createProduct({
        sku: 'TEST-SINGLE-002',
        isActive: false,
      });

      // Act
      const response = await request(app).get(`/api/products/${inactiveProduct.id}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should include all product fields', async () => {
      // Arrange
      const product = await createProduct({
        sku: 'TEST-SINGLE-003',
        images: ['/img1.jpg', '/img2.jpg'],
        category: 'Test Category',
      });

      // Act
      const response = await request(app).get(`/api/products/${product.id}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.product).toMatchObject({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stock: product.stock,
        sku: product.sku,
        category: product.category,
        images: product.images,
        isActive: true,
      });
    });
  });

  describe('GET /api/products/search', () => {
    it('should return products matching search query', async () => {
      // Arrange
      const searchProduct = await createProduct({
        sku: 'TEST-SEARCH-API-001',
        name: 'Searchable Product',
      });

      // Act
      const response = await request(app).get('/api/products/search?q=Searchable');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).toContain(searchProduct.id);
    });

    it('should return empty array for short query (less than 2 chars)', async () => {
      // Act
      const response = await request(app).get('/api/products/search?q=a');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(0);
    });

    it('should search case-insensitively', async () => {
      // Arrange
      const searchProduct = await createProduct({
        sku: 'TEST-SEARCH-API-002',
        name: 'Case Insensitive Test',
      });

      // Act
      const response = await request(app).get('/api/products/search?q=case insensitive');

      // Assert
      expect(response.status).toBe(200);
      const productIds = response.body.products.map((p: any) => p.id);
      expect(productIds).toContain(searchProduct.id);
    });

    it('should limit results to 20', async () => {
      // Act
      const response = await request(app).get('/api/products/search?q=Test');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(20);
    });

    it('should only return essential fields in search results', async () => {
      // Act
      const response = await request(app).get('/api/products/search?q=Test');

      // Assert
      expect(response.status).toBe(200);
      if (response.body.products.length > 0) {
        const product = response.body.products[0];
        expect(product.id).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.price).toBeDefined();
        expect(product.images).toBeDefined();
      }
    });
  });
});
