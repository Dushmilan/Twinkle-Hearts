/**
 * Request ID middleware
 * Generates a unique correlation ID for each request to enable request tracing
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = crypto.randomUUID();

  // Include request ID in response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);

  next();
};
