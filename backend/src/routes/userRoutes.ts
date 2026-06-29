import { Hono } from 'hono';
import {
  getUserProfile, updateUserProfile, changePassword,
  getUserAddresses, createAddress, updateAddress, deleteAddress,
  getUserWishlist, addToWishlist, removeFromWishlist,
} from '../services/userService.js';
import { getUserOrders } from '../services/orderService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { z } from 'zod';
import type { Env, Variables } from '../types.js';

type UserEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<UserEnv>();

router.use('*', authenticate);

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatar: z.string().url().optional(),
});

const addressSchema = z.object({
  label: z.string().min(1),
  type: z.enum(['HOME', 'WORK', 'BILLING', 'SHIPPING', 'OTHER']).optional(),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(2).default('LK'),
  phone: z.string().min(10),
  isDefault: z.boolean().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

router.get('/profile', async (c) => {
  const user = c.get('user');
  const profile = await getUserProfile(c.env, user.userId);
  return c.json({ success: true, data: profile });
});

router.put('/profile', async (c) => {
  const user = c.get('user');
  const input = profileSchema.parse(await c.req.json());
  const profile = await updateUserProfile(c.env, user.userId, input);
  return c.json({ success: true, message: 'Profile updated successfully', data: profile });
});

router.post('/change-password', apiLimiter, async (c) => {
  const user = c.get('user');
  const input = passwordSchema.parse(await c.req.json());
  await changePassword(c.env, user.userId, input.currentPassword, input.newPassword);
  return c.json({ success: true, message: 'Password changed successfully. Please login again.' });
});

router.get('/orders', async (c) => {
  const user = c.get('user');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const result = await getUserOrders(c.env, user.userId, page, limit);
  return c.json({ success: true, data: result });
});

router.get('/addresses', async (c) => {
  const user = c.get('user');
  const addresses = await getUserAddresses(c.env, user.userId);
  return c.json({ success: true, data: addresses });
});

router.post('/addresses', async (c) => {
  const user = c.get('user');
  const input = addressSchema.parse(await c.req.json());
  const address = await createAddress(c.env, user.userId, input);
  return c.json({ success: true, message: 'Address added successfully', data: address }, 201);
});

router.put('/addresses/:id', async (c) => {
  const user = c.get('user');
  const input = addressSchema.partial().parse(await c.req.json());
  const address = await updateAddress(c.env, user.userId, c.req.param('id'), input);
  return c.json({ success: true, message: 'Address updated successfully', data: address });
});

router.delete('/addresses/:id', async (c) => {
  const user = c.get('user');
  await deleteAddress(c.env, user.userId, c.req.param('id'));
  return c.json({ success: true, message: 'Address deleted successfully' });
});

router.get('/wishlist', async (c) => {
  const user = c.get('user');
  const wishlist = await getUserWishlist(c.env, user.userId);
  return c.json({ success: true, data: wishlist });
});

router.post('/wishlist/:productId', async (c) => {
  const user = c.get('user');
  const wishlist = await addToWishlist(c.env, user.userId, c.req.param('productId'));
  return c.json({ success: true, message: 'Added to wishlist', data: wishlist });
});

router.delete('/wishlist/:productId', async (c) => {
  const user = c.get('user');
  await removeFromWishlist(c.env, user.userId, c.req.param('productId'));
  return c.json({ success: true, message: 'Removed from wishlist' });
});

export default router;
