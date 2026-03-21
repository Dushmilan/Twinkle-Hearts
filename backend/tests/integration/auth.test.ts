/**
 * Integration Tests for Auth API
 * Tests registration, login, logout, and token refresh endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createAuthenticatedUser, generateTestToken, createSession } from '../helpers/auth.js';
import { hashPassword } from '../../src/utils/password.js';

const app = createTestApp();

describe('Auth API', () => {
  // Clean up before each test
  beforeEach(async () => {
    await testPrisma.session.deleteMany({});
    await testPrisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        phone: '+919876543210',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.name).toBe('New User');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      // Arrange
      const userData = {
        email: 'weakpass@example.com',
        password: '123', // Too short
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration with invalid email', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'First User',
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData);

      // Act - try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'DifferentPass456!',
          name: 'Second User',
        });

      // Assert
      expect(response.status).toBe(409);
    });

    it('should register user with minimal info', async () => {
      // Arrange
      const userData = {
        email: 'minimal@example.com',
        password: 'SecurePass123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('minimal@example.com');
      expect(response.body.data.user.role).toBe('CUSTOMER');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await testPrisma.user.create({
        data: {
          email: 'loginuser@example.com',
          passwordHash: await hashPassword('SecurePass123!'),
          name: 'Login User',
          phone: '+919876543210',
          role: 'CUSTOMER',
        },
      });
    });

    it('should login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'loginuser@example.com',
        password: 'SecurePass123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('loginuser@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject login with wrong password', async () => {
      // Arrange
      const credentials = {
        email: 'loginuser@example.com',
        password: 'WrongPassword!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject login with missing password', async () => {
      // Arrange
      const credentials = {
        email: 'loginuser@example.com',
        password: '',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject login for inactive user', async () => {
      // Arrange - create inactive user
      await testPrisma.user.create({
        data: {
          email: 'inactive@example.com',
          passwordHash: await hashPassword('SecurePass123!'),
          name: 'Inactive User',
          isActive: false,
        },
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'SecurePass123!',
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Arrange - create user and get tokens from login
      const userData = {
        email: `refresh-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const refreshToken = registerResponse.body.data.refreshToken;

      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject refresh with invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should reject refresh with missing token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' });

      // Assert
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid session', async () => {
      // Arrange - register user to get valid tokens
      const userData = {
        email: `logout-${Date.now()}@example.com`,
        password: 'SecurePass123!',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const token = registerResponse.body.data.accessToken;

      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send();

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without authentication', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .send();

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      // Arrange - register user to get valid tokens
      const userData = {
        email: `me-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        name: 'Profile User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const token = registerResponse.body.data.accessToken;

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe('Profile User');
    });

    it('should reject unauthenticated request', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .send();

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should login/signup with Google OAuth', async () => {
      // Arrange
      const googleData = {
        email: 'googleuser@gmail.com',
        name: 'Google User',
        avatar: 'https://example.com/avatar.jpg',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('googleuser@gmail.com');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should create new user on first Google login', async () => {
      // Arrange
      const googleData = {
        email: 'newgoogle@gmail.com',
        name: 'New Google User',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert first login creates user
      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('newgoogle@gmail.com');

      // Act - login again with same email
      const response2 = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert - should login existing user
      expect(response2.status).toBe(200);
      expect(response2.body.data.user.email).toBe('newgoogle@gmail.com');
    });

    it('should reject Google login without email', async () => {
      // Arrange
      const googleData = {
        name: 'No Email User',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
