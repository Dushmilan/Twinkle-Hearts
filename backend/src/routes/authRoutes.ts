import { Hono } from 'hono';
import { register, login, logout, refreshToken, googleOAuth } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { getUserProfile } from '../services/userService.js';
import type { Env, Variables } from '../types.js';

type AuthEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<AuthEnv>();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Phone must be 10-15 digits, optionally prefixed with +').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

router.post('/register', apiLimiter, async (c) => {
  const input = registerSchema.parse(await c.req.json());
  const result = await register(c.env, input);
  return c.json({ success: true, message: 'Registration successful', data: result }, 201);
});

router.post('/login', apiLimiter, async (c) => {
  const input = loginSchema.parse(await c.req.json());
  const result = await login(c.env, input);
  return c.json({ success: true, message: 'Login successful', data: result });
});

router.post('/refresh', apiLimiter, async (c) => {
  const input = refreshSchema.parse(await c.req.json());
  const result = await refreshToken(c.env, input.refreshToken);
  return c.json({ success: true, data: result });
});

router.post('/logout', authenticate, async (c) => {
  const user = c.get('user');
  await logout(c.env, user.sessionId);
  return c.json({ success: true, message: 'Logout successful' });
});

router.get('/me', authenticate, async (c) => {
  const user = c.get('user');
  const profile = await getUserProfile(c.env, user.userId);
  return c.json({ success: true, data: profile });
});

router.post('/google', apiLimiter, async (c) => {
  const { idToken } = await c.req.json();
  if (!idToken) throw new BadRequestError('Google ID token is required');
  const result = await googleOAuth(c.env, idToken);
  return c.json({ success: true, message: 'Google login successful', data: result });
});

export default router;
