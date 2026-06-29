import type { Context, ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class StockUnavailableError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'StockUnavailableError';
  }
}

export const errorHandler: ErrorHandler = (err, c: Context) => {
  const requestId = c.get('requestId') as string | undefined;

  if (err instanceof AppError || err instanceof HTTPException) {
    const statusCode = err instanceof HTTPException ? err.status : err.statusCode;
    console.warn(`${statusCode} - ${err.message} - ${c.req.path}`);

    const response: Record<string, any> = { error: err.message };
    if (requestId) response.requestId = requestId;
    return c.json(response, statusCode as any);
  }

  console.error('Unhandled error:', err.message, err.stack);
  const env = (c.env as any)?.NODE_ENV;
  return c.json(
    { error: env === 'production' ? 'Internal server error' : err.message },
    500
  );
};
