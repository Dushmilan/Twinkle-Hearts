import { Router } from 'express';
import { productService } from '../services/productService.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/products
 * List all active products with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;

    const result = await productService.listProducts({
      page,
      limit,
      search,
      category,
      activeOnly: true,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/search
 * Search products
 * Note: This route must be defined BEFORE /:id to avoid conflicts
 */
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q as string;

    if (!q || q.length < 2) {
      res.json({ products: [] });
      return;
    }

    const products = await productService.searchProducts(q, 20);

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id, true);

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

export default router;
