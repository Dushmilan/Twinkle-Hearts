import { Router } from 'express';
import { validateCartSync } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/cart/sync
 * Sync cart with backend - validates products and returns current prices
 */
router.post('/sync', validateCartSync, async (req, res) => {
  const validatedItems = req.body.validatedItems;

  // Return validated cart with current prices
  res.json({
    items: validatedItems,
    syncedAt: new Date().toISOString(),
  });
});

export default router;
