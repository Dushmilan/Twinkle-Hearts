/**
 * Integration Tests for Auth API
 * Tests registration, login, logout, and token refresh endpoints
 */

import request from 'supertest';
import { createTestApp } from '../helpers/testApp.js';
import testPrisma from '../helpers/db.js';
import { createAuthenticatedUser, generateTestToken, createSession } from '../helpers/auth.js';
import { hashPassword } from '../../src/utils/password.js';
import {
  TEST_PASSWORD,
  TEST_PASSWORD_WEAK,
  TEST_PASSWORD_ALT,
  TEST_EMAIL,
  TEST_EMAIL_ALT,
  TEST_EMAIL_DUPLICATE,
  TEST_EMAIL_INVALID,
  TEST_USER_NAME,
  TEST_USER_NAME_ALT,
  TEST_USER_PHONE,
  TEST_USER_ROLE,
  HTTP_STATUS,
} from '../helpers/constants.js';

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
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_USER_NAME,
        phone: TEST_USER_PHONE,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(TEST_EMAIL);
      expect(response.body.data.user.name).toBe(TEST_USER_NAME);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      // Arrange
      const userData = {
        email: 'weakpass@example.com',
        password: TEST_PASSWORD_WEAK,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject registration with invalid email', async () => {
      // Arrange
      const userData = {
        email: TEST_EMAIL_INVALID,
        password: TEST_PASSWORD,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject duplicate email registration', async () => {
      // Arrange
      const userData = {
        email: TEST_EMAIL_DUPLICATE,
        password: TEST_PASSWORD,
        name: TEST_USER_NAME,
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData);

      // Act - try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: TEST_EMAIL_DUPLICATE,
          password: TEST_PASSWORD_ALT,
          name: TEST_USER_NAME_ALT,
        });

      // Assert
      expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    });

    it('should register user with minimal info', async () => {
      // Arrange
      const userData = {
        email: 'minimal@example.com',
        password: TEST_PASSWORD,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body.data.user.email).toBe('minimal@example.com');
      expect(response.body.data.user.role).toBe(TEST_USER_ROLE);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange - create test user
      const testEmail = 'loginuser@example.com';
      await testPrisma.user.create({
        data: {
          email: testEmail,
          passwordHash: await hashPassword(TEST_PASSWORD),
          name: TEST_USER_NAME,
          phone: TEST_USER_PHONE,
          role: TEST_USER_ROLE,
        },
      });

      const credentials = {
        email: testEmail,
        password: TEST_PASSWORD,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD,
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject login with wrong password', async () => {
      // Arrange - create test user
      const testEmail = 'wrongpass@example.com';
      await testPrisma.user.create({
        data: {
          email: testEmail,
          passwordHash: await hashPassword(TEST_PASSWORD),
          name: TEST_USER_NAME,
          phone: TEST_USER_PHONE,
          role: TEST_USER_ROLE,
        },
      });

      const credentials = {
        email: testEmail,
        password: 'WrongPassword!',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject login with missing password', async () => {
      // Arrange - create test user
      const testEmail = 'nopass@example.com';
      await testPrisma.user.create({
        data: {
          email: testEmail,
          passwordHash: await hashPassword(TEST_PASSWORD),
          name: TEST_USER_NAME,
          phone: TEST_USER_PHONE,
          role: TEST_USER_ROLE,
        },
      });

      const credentials = {
        email: testEmail,
        password: '',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('should reject login for inactive user', async () => {
      // Arrange - create inactive user
      const testEmail = 'inactive@example.com';
      await testPrisma.user.create({
        data: {
          email: testEmail,
          passwordHash: await hashPassword(TEST_PASSWORD),
          name: 'Inactive User',
          isActive: false,
        },
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: TEST_PASSWORD,
        });

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Arrange - create user and get tokens from login
      const userData = {
        email: `refresh-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
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
      expect(response.status).toBe(HTTP_STATUS.OK);
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
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject refresh with missing token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' });

      // Assert
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid session', async () => {
      // Arrange - register user to get valid tokens
      const userData = {
        email: `logout-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
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
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without authentication', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .send();

      // Assert
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info', async () => {
      // Arrange - register user to get valid tokens
      const userData = {
        email: `me-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
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
      expect(response.status).toBe(HTTP_STATUS.OK);
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
      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should login/signup with Google OAuth', async () => {
      // Arrange
      const googleData = {
        email: `google-${Date.now()}@gmail.com`,
        name: 'Google User',
        avatar: 'https://example.com/avatar.jpg',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(googleData.email);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should create new user on first Google login and existing user on second', async () => {
      // Arrange - use unique email for test isolation
      const googleEmail = `newgoogle-${Date.now()}@gmail.com`;
      const googleData = {
        email: googleEmail,
        name: 'New Google User',
      };

      // Act - first login (signup)
      const response = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert first login creates user
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.data.user.email).toBe(googleEmail);

      // Act - second login with same email (should login existing user)
      const response2 = await request(app)
        .post('/api/auth/google')
        .send(googleData);

      // Assert - should login existing user
      expect(response2.status).toBe(HTTP_STATUS.OK);
      expect(response2.body.data.user.email).toBe(googleEmail);
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
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
