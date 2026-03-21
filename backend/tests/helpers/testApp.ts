/**
 * Test App Helper
 * Creates an Express app instance for testing without starting a server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import productRoutes from '../../src/routes/productRoutes.js';
import cartRoutes from '../../src/routes/cartRoutes.js';
import orderRoutes from '../../src/routes/orderRoutes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { rateLimiter } from '../../src/middleware/rateLimiter.js';

export function createTestApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting (disabled for tests via env)
  app.use(rateLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
