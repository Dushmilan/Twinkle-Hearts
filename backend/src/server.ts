import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import swaggerSpec from './lib/swagger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initCloudinary } from './lib/cloudinary.js';
import prisma from './lib/prisma.js';
import { redis } from './lib/redis.js';

// Load environment variables from backend/.env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Initialize Cloudinary with loaded env vars
initCloudinary();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
const maxFileSize = process.env.MAX_FILE_SIZE || '5mb';
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: maxFileSize }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use(rateLimiter);

// Request correlation ID
app.use(requestId);

// Health check with dependency pings
app.get('/health', async (req, res) => {
  const health: {
    status: string;
    database?: string;
    redis?: string;
    timestamp: string;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch {
    health.database = 'disconnected';
    health.status = 'error';
  }

  // Check Redis (if configured)
  if (redis) {
    try {
      await redis.ping();
      health.redis = 'connected';
    } catch {
      health.redis = 'disconnected';
    }
  } else {
    health.redis = 'disabled';
  }

  const statusCode = health.status === 'error' ? 503 : 200;
  res.status(statusCode).json(health);
});

// M8: Add Cache-Control headers for sensitive authenticated endpoints
app.use((req, res, next) => {
  // Prevent caching for authenticated API routes
  if (
    req.path.startsWith('/api/users') ||
    req.path.startsWith('/api/admin') ||
    req.path.startsWith('/api/orders') ||
    req.path.startsWith('/api/cart')
  ) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// L2: API Documentation - Only serve Swagger in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Twinkle-Hearts API Docs',
  }));
}

// Public API Routes
app.use('/api/auth', authRoutes);

// Protected API Routes (authentication required)
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Admin API Routes (admin role required)
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
