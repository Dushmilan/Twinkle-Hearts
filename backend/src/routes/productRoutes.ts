import { Hono } from 'hono';
import { productService } from '../services/productService.js';
import type { Env, Variables } from '../types.js';

type ProdEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<ProdEnv>();

router.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search');
  const category = c.req.query('category');

  const result = await productService.listProducts(c.env, {
    page, limit, search, category, activeOnly: true,
  });

  return c.json(result);
});

router.get('/search', async (c) => {
  const q = c.req.query('q');
  if (!q || q.length < 2) {
    return c.json({ products: [] });
  }

  const products = await productService.searchProducts(c.env, q, 20);
  return c.json({ products });
});

router.get('/:id', async (c) => {
  const product = await productService.getProductById(c.env, c.req.param('id'), true);
  return c.json({ product });
});

export default router;
