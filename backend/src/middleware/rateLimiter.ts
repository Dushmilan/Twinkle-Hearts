import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

// Stricter rate limiter for order creation
export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.ORDER_RATE_LIMIT_MAX || '5'), // 5 orders per window
  message: { error: 'Too many order attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

// Combined rate limiter middleware
export const rateLimiter = (req: Request, res: Response, next: () => void) => {
  apiLimiter(req, res, next);
};

export const orderRateLimit = (req: Request, res: Response, next: () => void) => {
  orderRateLimiter(req, res, next);
};
