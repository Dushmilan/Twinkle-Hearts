/**
 * Integration Tests for Admin API
 * Tests dashboard stats, product CRUD, order management, user management, and role enforcement
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createAdminUser, createAuthenticatedUser } from '../helpers/auth.js';
import { createProduct, createUser } from '../helpers/factories.js';
import {
  HTTP_STATUS,
  TEST_PRODUCT_NAME,
  TEST_PRODUCT_DESCRIPTION,
  TEST_PRODUCT_PRICE,
  TEST_PRODUCT_STOCK,
  TEST_PRODUCT_CATEGORY,
} from '../helpers/constants.js';

const app = createTestApp();

describe('Admin API', () => {
  beforeEach(async () => {
    await testPrisma.orderItem.deleteMany({});
    await testPrisma.order.deleteMany({});
    await testPrisma.wishlist.deleteMany({});
    await testPrisma.address.deleteMany({});
    await testPrisma.session.deleteMany({});
    await testPrisma.adminLog.deleteMany({});
    await testPrisma.product.deleteMany({});
    await testPrisma.user.deleteMany({});
  });

  describe('Role Enforcement', () => {
    it('should reject non-admin accessing admin stats', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should reject unauthenticated access to admin routes', async () => {
      const response = await request(app).get('/api/admin/stats');

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should allow admin to access admin stats', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalOrders).toBeDefined();
      expect(response.body.data.totalUsers).toBeDefined();
      expect(response.body.data.totalProducts).toBeDefined();
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return dashboard statistics', async () => {
      const { token } = await createAdminUser();

      // Seed some data
      await createProduct({ sku: 'ADMIN-STATS-001' });
      await createUser({ email: 'stats-user@example.com' });

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.totalProducts).toBe(1);
      expect(response.body.data.totalUsers).toBe(2); // admin + seed user
    });
  });

  describe('GET /api/admin/orders', () => {
    it('should return paginated orders', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .get('/api/admin/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.pagination.limit).toBe(5);
    });
  });

  describe('Admin Product CRUD', () => {
    it('should create a new product', async () => {
      const { token } = await createAdminUser();

      const productData = {
        name: 'Admin Created Product',
        description: 'A product created by admin for testing',
        price: 2999,
        stock: 100,
        sku: 'ADMIN-PRODUCT-001',
        category: 'Admin Test',
        images: ['https://example.com/image.jpg'],
      };

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.data.name).toBe('Admin Created Product');
      expect(response.body.data.price).toBe(2999);
      expect(response.body.data.sku).toBe('ADMIN-PRODUCT-001');
    });

    it('should reject product creation with invalid data', async () => {
      const { token } = await createAdminUser();

      const productData = {
        name: 'A', // Too short
        description: 'Short', // Too short
        price: -1, // Negative
      };

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should get all products with pagination', async () => {
      const { token } = await createAdminUser();

      await createProduct({ sku: 'ADMIN-PRODUCTS-LIST-001' });
      await createProduct({ sku: 'ADMIN-PRODUCTS-LIST-002' });

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.products.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should search products by name', async () => {
      const { token } = await createAdminUser();

      await createProduct({
        sku: 'ADMIN-SEARCH-001',
        name: 'Unique Admin Search Product',
      });

      const response = await request(app)
        .get('/api/admin/products?search=Unique Admin Search')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.products.length).toBe(1);
    });

    it('should filter products by category', async () => {
      const { token } = await createAdminUser();

      await createProduct({
        sku: 'ADMIN-CAT-001',
        category: 'Electronics',
      });
      await createProduct({
        sku: 'ADMIN-CAT-002',
        category: 'Clothing',
      });

      const response = await request(app)
        .get('/api/admin/products?category=Electronics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].category).toBe('Electronics');
    });

    it('should update a product', async () => {
      const { token } = await createAdminUser();

      const product = await createProduct({ sku: 'ADMIN-UPDATE-001' });

      const updateData = {
        name: 'Updated Product Name',
        price: 3999,
      };

      const response = await request(app)
        .put(`/api/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.name).toBe('Updated Product Name');
      expect(response.body.data.price).toBe(3999);
    });

    it('should reject updating non-existent product', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .put('/api/admin/products/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should partially update a product', async () => {
      const { token } = await createAdminUser();

      const product = await createProduct({
        sku: 'ADMIN-PARTIAL-UPDATE-001',
        name: 'Original Name',
      });

      const response = await request(app)
        .put(`/api/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ price: 4999 });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.price).toBe(4999);
      expect(response.body.data.name).toBe('Original Name'); // Unchanged
    });

    it('should delete a product', async () => {
      const { token } = await createAdminUser();

      const product = await createProduct({
        sku: 'ADMIN-DELETE-001',
        images: [],
      });

      const response = await request(app)
        .delete(`/api/admin/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.message).toBe('Product deleted successfully');

      // Verify deletion
      const deleted = await testPrisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject deleting non-existent product', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .delete('/api/admin/products/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('Admin User Management', () => {
    it('should get all users with pagination', async () => {
      const { token } = await createAdminUser();

      await createUser({ email: 'admin-user-list@example.com' });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(2); // admin + seed
    });

    it('should search users by name or email', async () => {
      const { token } = await createAdminUser();

      await createUser({
        email: 'unique-search-user@example.com',
        name: 'Unique Search User',
      });

      const response = await request(app)
        .get('/api/admin/users?search=Unique Search')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should update user role', async () => {
      const { token } = await createAdminUser();

      const user = await createUser({ email: 'role-update@example.com' });

      const response = await request(app)
        .put(`/api/admin/users/${user.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.role).toBe('ADMIN');
    });

    it('should reject invalid role update', async () => {
      const { token } = await createAdminUser();

      const user = await createUser({ email: 'invalid-role@example.com' });

      const response = await request(app)
        .put(`/api/admin/users/${user.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'SUPERADMIN' });

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject updating non-existent user role', async () => {
      const { token } = await createAdminUser();

      const response = await request(app)
        .put('/api/admin/users/non-existent-id/role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});
