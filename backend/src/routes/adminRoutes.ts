import { Hono } from 'hono';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';
import {
  getDashboardStats, createProduct, updateProduct, deleteProduct,
  uploadProductImages, updateUserRole, getAllUsers,
} from '../services/adminService.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { getPrismaRepository } from '../lib/prisma.js';
import type { Env, Variables } from '../types.js';

type AdminEnv = { Bindings: Env; Variables: Variables };
const router = new Hono<AdminEnv>();

router.use('*', authenticate, requireAdmin);

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  category: z.string().min(1, 'Category is required'),
  images: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return [val]; }
      }
      return val;
    },
    z.array(z.string()).min(1, 'At least one product image is required')
  ),
  isActive: z.boolean().optional().default(true),
});

const updateProductSchema = productSchema.partial();

router.post('/products/upload', async (c) => {
  const formData = await c.req.parseBody();
  const files = formData['images'];

  if (!files) {
    throw new BadRequestError('No files uploaded');
  }

  const fileArray = Array.isArray(files) ? files : [files];
  const result = await uploadProductImages(c.env, fileArray as any);

  return c.json({ success: true, data: result });
});

router.get('/stats', async (c) => {
  const stats = await getDashboardStats(c.env);
  return c.json({ success: true, data: stats });
});

router.get('/orders', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const prisma = getPrismaRepository(c.env.DB);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count(),
  ]);

  return c.json({
    success: true,
    data: { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

router.get('/products', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const category = c.req.query('category');
  const search = c.req.query('search');
  const prisma = getPrismaRepository(c.env.DB);

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  return c.json({
    success: true,
    data: { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

router.post('/products', async (c) => {
  const body: any = await c.req.json();
  const input = productSchema.parse(body);
  const product = await createProduct(c.env, { ...input, images: JSON.stringify(input.images) });
  return c.json({ success: true, data: product }, 201);
});

router.put('/products/:id', async (c) => {
  const body: any = await c.req.json();
  const input = updateProductSchema.parse(body);
  const data = input.images !== undefined ? { ...input, images: JSON.stringify(input.images) } : input;
  const product = await updateProduct(c.env, c.req.param('id'), data);
  return c.json({ success: true, data: product });
});

router.delete('/products/:id', async (c) => {
  const result = await deleteProduct(c.env, c.req.param('id'));
  return c.json({ success: true, message: 'Product deleted successfully', data: result });
});

router.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const search = c.req.query('search') || '';
  const result = await getAllUsers(c.env, page, limit, search);
  return c.json({ success: true, data: result });
});

router.put('/users/:id/role', async (c) => {
  const user = c.get('user');
  const { role } = await c.req.json() as { role: string };
  const updatedUser = await updateUserRole(c.env, c.req.param('id'), role, user.userId);
  return c.json({ success: true, data: updatedUser });
});

export default router;
