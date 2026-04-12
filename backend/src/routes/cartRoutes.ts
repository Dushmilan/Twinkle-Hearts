import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateCartSync } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/cart/sync
 * Sync cart with backend - validates products and returns current prices
 * Requires authentication to prevent product catalog scraping
 */
router.post('/sync', authenticate, validateCartSync, async (req, res) => {
  const validatedItems = req.body.validatedItems;

  // Return validated cart with current prices
  res.json({
    items: validatedItems,
    syncedAt: new Date().toISOString(),
  });
});

export default router;
