// Redis client configuration
// Private Commercial Project - Confidential

import Redis from 'ioredis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let redis: Redis | null = null;

if (REDIS_ENABLED) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis max retries reached, falling back to in-memory');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => {
    logger.info('✅ Connected to Redis');
  });

  redis.on('error', (err) => {
    logger.error('❌ Redis error:', err.message);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });
} else {
  logger.info('ℹ️  Redis disabled, using in-memory fallback');
}

export { redis };
export default redis;
