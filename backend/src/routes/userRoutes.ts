// User routes
// Private Commercial Project - Confidential

import { Router } from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/userService.js';
import { getUserOrders } from '../services/orderService.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
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

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', async (req, res, next) => {
  try {
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
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    const user = await updateUserProfile(req.user!.id, input);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/change-password
 * Change password
 */
router.post('/change-password', rateLimiter, async (req, res, next) => {
  try {
    const input = passwordSchema.parse(req.body);
    await changePassword(req.user!.id, input.currentPassword, input.newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/orders
 * Get user's order history
 */
router.get('/orders', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await getUserOrders(req.user!.id, page, limit);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/addresses
 * Get user's saved addresses
 */
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await getUserAddresses(req.user!.id);
    
    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/addresses
 * Add new address
 */
router.post('/addresses', async (req, res, next) => {
  try {
    const input = addressSchema.parse(req.body);
    const address = await createAddress(req.user!.id, input);
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/addresses/:id
 * Update address
 */
router.put('/addresses/:id', async (req, res, next) => {
  try {
    const input = addressSchema.partial().parse(req.body);
    const address = await updateAddress(req.user!.id, req.params.id, input);
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/addresses/:id
 * Delete address
 */
router.delete('/addresses/:id', async (req, res, next) => {
  try {
    await deleteAddress(req.user!.id, req.params.id);
    
    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/wishlist
 * Get user's wishlist
 */
router.get('/wishlist', async (req, res, next) => {
  try {
    const wishlist = await getUserWishlist(req.user!.id);
    
    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/wishlist/:productId
 * Add product to wishlist
 */
router.post('/wishlist/:productId', async (req, res, next) => {
  try {
    const wishlist = await addToWishlist(req.user!.id, req.params.productId);
    
    res.json({
      success: true,
      message: 'Added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/wishlist/:productId
 * Remove product from wishlist
 */
router.delete('/wishlist/:productId', async (req, res, next) => {
  try {
    await removeFromWishlist(req.user!.id, req.params.productId);
    
    res.json({
      success: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
