/**
 * Integration Tests for User API
 * Tests profile, addresses, orders, and wishlist endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createAuthenticatedUser, createAdminUser } from '../helpers/auth.js';
import { createProduct, createOrder } from '../helpers/factories.js';
import { hashPassword } from '../../src/utils/password.js';

const app = createTestApp();

describe('User API', () => {
  beforeEach(async () => {
    await testPrisma.orderItem.deleteMany({});
    await testPrisma.order.deleteMany({});
    await testPrisma.wishlist.deleteMany({});
    await testPrisma.address.deleteMany({});
    await testPrisma.session.deleteMany({});
    await testPrisma.user.deleteMany({});
    await testPrisma.product.deleteMany({});
  });

  describe('GET /api/users/profile', () => {
    it('should return current user profile', async () => {
      // Arrange
      const { user, token } = await createAuthenticatedUser({
        email: 'profiletest@example.com',
        name: 'Profile Test User',
      });

      // Act
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe('profiletest@example.com');
      expect(response.body.data.name).toBe('Profile Test User');
      expect(response.body.data.role).toBe('CUSTOMER');
    });

    it('should reject unauthenticated request', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/profile')
        .send();

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      // Arrange
      const { user, token } = await createAuthenticatedUser();

      const updateData = {
        name: 'Updated Name',
        phone: '+919999999999',
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.phone).toBe('+919999999999');
    });

    it('should reject update with invalid data', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser();

      const updateData = {
        name: 'A', // Too short
      };

      // Act
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should partially update profile', async () => {
      // Arrange
      const { user, token } = await createAuthenticatedUser({
        name: 'Original Name',
      });

      // Act - update only phone
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+918888888888' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.phone).toBe('+918888888888');
      expect(response.body.data.name).toBe('Original Name'); // Unchanged
    });
  });

  describe('POST /api/users/change-password', () => {
    beforeEach(async () => {
      // Create user with known password
      await testPrisma.user.create({
        data: {
          email: 'passwordtest@example.com',
          passwordHash: await hashPassword('CurrentPass123!'),
          name: 'Password Test User',
        },
      });
    });

    it('should change password successfully', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser({
        email: 'passwordtest@example.com',
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456!',
      };

      // Act
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject with wrong current password', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser({
        email: 'passwordtest@example.com',
      });

      const passwordData = {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewSecurePass456!',
      };

      // Act
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject with weak new password', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser({
        email: 'passwordtest@example.com',
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: '123', // Too weak
      };

      // Act
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject without current password', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser({
        email: 'passwordtest@example.com',
      });

      const passwordData = {
        newPassword: 'NewSecurePass456!',
      };

      // Act
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/orders', () => {
    it('should return user order history', async () => {
      // Arrange
      const { user, token } = await createAuthenticatedUser();
      const product = await createProduct({ sku: 'USER-ORDER-001' });

      await createOrder({
        userId: user.id,
        customerName: user.name || 'Test User',
        customerPhone: user.phone || '+919876543210',
        items: [{
          productId: product.id,
          quantity: 1,
          price: Number(product.price),
          productName: product.name,
        }],
      });

      // Act
      const response = await request(app)
        .get('/api/users/orders')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.orders.length).toBe(1);
    });

    it('should return empty orders for user with no orders', async () => {
      // Arrange
      const { token } = await createAuthenticatedUser();

      // Act
      const response = await request(app)
        .get('/api/users/orders')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.orders).toEqual([]);
    });

    it('should support pagination', async () => {
      // Arrange
      const { user, token } = await createAuthenticatedUser();
      const product = await createProduct({ sku: 'USER-ORDER-PAGE-001' });

      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        await createOrder({
          userId: user.id,
          customerName: `Order ${i}`,
          items: [{
            productId: product.id,
            quantity: 1,
            price: Number(product.price),
            productName: product.name,
          }],
        });
      }

      // Act - get first page
      const response = await request(app)
        .get('/api/users/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.orders.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('Address Endpoints', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser();
      token = auth.token;
      userId = auth.user.id;
    });

    describe('GET /api/users/addresses', () => {
      it('should return user addresses', async () => {
        // Arrange
        await testPrisma.address.create({
          data: {
            userId,
            label: 'Home',
            type: 'HOME',
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zip: '12345',
            country: 'LK',
            phone: '+919876543210',
            isDefault: true,
          },
        });

        // Act
        const response = await request(app)
          .get('/api/users/addresses')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].label).toBe('Home');
      });

      it('should return empty array for user with no addresses', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/addresses')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
      });
    });

    describe('POST /api/users/addresses', () => {
      it('should create new address', async () => {
        // Arrange
        const addressData = {
          label: 'Work',
          type: 'WORK',
          street: '456 Office Rd',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'IN',
          phone: '+919876543210',
        };

        // Act
        const response = await request(app)
          .post('/api/users/addresses')
          .set('Authorization', `Bearer ${token}`)
          .send(addressData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.label).toBe('Work');
        expect(response.body.data.street).toBe('456 Office Rd');
      });

      it('should reject address with missing required fields', async () => {
        // Arrange
        const addressData = {
          label: 'Incomplete',
          // Missing street, city, etc.
        };

        // Act
        const response = await request(app)
          .post('/api/users/addresses')
          .set('Authorization', `Bearer ${token}`)
          .send(addressData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should create address with default type HOME', async () => {
        // Arrange
        const addressData = {
          label: 'Default Home',
          street: '789 Default St',
          city: 'Colombo',
          state: 'Western',
          zip: '00100',
          phone: '+94771234567',
        };

        // Act
        const response = await request(app)
          .post('/api/users/addresses')
          .set('Authorization', `Bearer ${token}`)
          .send(addressData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.data.type).toBe('HOME');
      });
    });

    describe('PUT /api/users/addresses/:id', () => {
      it('should update address', async () => {
        // Arrange
        const address = await testPrisma.address.create({
          data: {
            userId,
            label: 'Old Label',
            type: 'HOME',
            street: 'Old Street',
            city: 'Old City',
            state: 'Old State',
            zip: '00000',
            country: 'LK',
            phone: '+919876543210',
          },
        });

        const updateData = {
          label: 'Updated Label',
          street: 'New Street',
        };

        // Act
        const response = await request(app)
          .put(`/api/users/addresses/${address.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateData);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.label).toBe('Updated Label');
        expect(response.body.data.street).toBe('New Street');
      });

      it('should reject updating non-existent address', async () => {
        // Act
        const response = await request(app)
          .put('/api/users/addresses/non-existent-id')
          .set('Authorization', `Bearer ${token}`)
          .send({ label: 'Test' });

        // Assert
        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/users/addresses/:id', () => {
      it('should delete address', async () => {
        // Arrange
        const address = await testPrisma.address.create({
          data: {
            userId,
            label: 'To Delete',
            type: 'OTHER',
            street: 'Delete St',
            city: 'Delete City',
            state: 'Delete State',
            zip: '99999',
            country: 'LK',
            phone: '+919876543210',
          },
        });

        // Act
        const response = await request(app)
          .delete(`/api/users/addresses/${address.id}`)
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify deletion
        const deleted = await testPrisma.address.findUnique({
          where: { id: address.id },
        });
        expect(deleted).toBeNull();
      });

      it('should reject deleting non-existent address', async () => {
        // Act
        const response = await request(app)
          .delete('/api/users/addresses/non-existent-id')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(404);
      });
    });
  });

  describe('Wishlist Endpoints', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser();
      token = auth.token;
      userId = auth.user.id;
    });

    describe('GET /api/users/wishlist', () => {
      it('should return user wishlist', async () => {
        // Arrange
        const product = await createProduct({ sku: 'WISHLIST-001' });

        await testPrisma.wishlist.create({
          data: {
            userId,
            productId: product.id,
          },
        });

        // Act
        const response = await request(app)
          .get('/api/users/wishlist')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].productId).toBe(product.id);
      });

      it('should return empty wishlist for user with no items', async () => {
        // Act
        const response = await request(app)
          .get('/api/users/wishlist')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
      });
    });

    describe('POST /api/users/wishlist/:productId', () => {
      it('should add product to wishlist', async () => {
        // Arrange
        const product = await createProduct({ sku: 'WISHLIST-ADD-001' });

        // Act
        const response = await request(app)
          .post(`/api/users/wishlist/${product.id}`)
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Added to wishlist');
      });

      it('should reject adding same product twice', async () => {
        // Arrange
        const product = await createProduct({ sku: 'WISHLIST-DUP-001' });

        await testPrisma.wishlist.create({
          data: {
            userId,
            productId: product.id,
          },
        });

        // Act
        const response = await request(app)
          .post(`/api/users/wishlist/${product.id}`)
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(409);
      });

      it('should reject adding non-existent product', async () => {
        // Act
        const response = await request(app)
          .post('/api/users/wishlist/non-existent-id')
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(404);
      });
    });

    describe('DELETE /api/users/wishlist/:productId', () => {
      it('should remove product from wishlist', async () => {
        // Arrange
        const product = await createProduct({ sku: 'WISHLIST-REMOVE-001' });

        await testPrisma.wishlist.create({
          data: {
            userId,
            productId: product.id,
          },
        });

        // Act
        const response = await request(app)
          .delete(`/api/users/wishlist/${product.id}`)
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Removed from wishlist');
      });

      it('should reject removing non-existent wishlist item', async () => {
        // Arrange
        const product = await createProduct({ sku: 'WISHLIST-NOTFOUND-001' });

        // Act
        const response = await request(app)
          .delete(`/api/users/wishlist/${product.id}`)
          .set('Authorization', `Bearer ${token}`);

        // Assert
        expect(response.status).toBe(404);
      });
    });
  });
});
