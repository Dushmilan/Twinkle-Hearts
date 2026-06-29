import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger as honoLogger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { HTTPException } from 'hono/http-exception';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import type { Env } from './types.js';

const app = new Hono<{ Bindings: Env }>();

// Apply global middleware
app.use('*', honoLogger());
app.use('*', trimTrailingSlash());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin, c) => c.env.CORS_ORIGIN || 'https://app.twinklehearts.com',
  credentials: true,
}));
app.use('*', requestId);

// Body parsing is built into Hono (c.req.json(), c.req.parseBody())

// Health check
app.get('/health', async (c) => {
  const health: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  try {
    await c.env.DB.prepare('SELECT 1').run();
    health.database = 'connected';
  } catch {
    health.database = 'disconnected';
    health.status = 'error';
  }

  try {
    await c.env.KV.get('health-check');
    health.cache = 'connected';
  } catch {
    health.cache = 'disconnected';
  }

  const statusCode = health.status === 'error' ? 503 : 200;
  return c.json(health, statusCode as 200 | 503);
});

// API Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/products', productRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/admin', adminRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

// Error handler
app.onError(errorHandler);

export default {
  fetch: app.fetch,
};
