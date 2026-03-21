// Authentication routes
// Private Commercial Project - Confidential

import { Router } from 'express';
import { register, login, logout, refreshToken, googleOAuth } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Valid phone number required').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', rateLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', rateLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const input = refreshSchema.parse(req.body);
    const result = await refreshToken(input.refreshToken);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate session)
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await logout(req.user!.sessionId);
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { getUserProfile } = await import('../services/authService.js');
    const user = await getUserProfile(req.user!.id);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/google
 * Google OAuth login/signup
 */
router.post('/google', async (req, res, next) => {
  try {
    const { email, name, avatar } = req.body;
    
    if (!email) {
      throw new BadRequestError('Email is required');
    }
    
    const result = await googleOAuth(email, name, avatar);
    
    res.json({
      success: true,
      message: 'Google login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
