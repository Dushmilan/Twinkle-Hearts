import { Hono } from 'hono';
import { authenticate } from '../middleware/auth.js';
import { validateCartSync } from '../middleware/validation.js';
import type { Env, Variables } from '../types.js';

type CartEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<CartEnv>();

router.post('/sync', authenticate, validateCartSync, async (c) => {
  const validatedItems = c.get('validatedItems');
  return c.json({
    items: validatedItems,
    syncedAt: new Date().toISOString(),
  });
});

export default router;
