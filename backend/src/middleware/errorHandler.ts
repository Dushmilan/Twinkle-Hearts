import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../lib/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, StatusCodes.CONFLICT);
  }
}

export class StockUnavailableError extends AppError {
  productId: string;
  available: number;
  requested: number;

  constructor(productId: string, available: number, requested: number) {
    super('Stock unavailable', StatusCodes.BAD_REQUEST);
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} - ${err.message} - ${req.path}`);
    
    const response: any = {
      error: err.message,
    };

    if (err instanceof StockUnavailableError) {
      response.details = {
        productId: err.productId,
        available: err.available,
        requested: err.requested,
      };
    }

    return res.status(err.statusCode).json(response);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Database error:', err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Database operation failed',
    });
  }

  // Unhandled errors
  logger.error('Unhandled error:', err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};
