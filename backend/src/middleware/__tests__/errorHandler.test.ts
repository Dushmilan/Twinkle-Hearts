import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import { AppError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, ConflictError, StockUnavailableError, errorHandler } from '../errorHandler.js';

describe('Error Classes', () => {
  it('AppError should set statusCode and message', () => {
    const err = new AppError('Test error', 400);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('AppError');
  });

  it('NotFoundError should have 404 status', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');

    const custom = new NotFoundError('Custom not found');
    expect(custom.message).toBe('Custom not found');
  });

  it('BadRequestError should have 400 status', () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
  });

  it('UnauthorizedError should have 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('ForbiddenError should have 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
  });

  it('ConflictError should have 409 status', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Resource conflict');
  });

  it('StockUnavailableError should have 400 status', () => {
    const err = new StockUnavailableError('Not enough stock');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Not enough stock');
    expect(err.name).toBe('StockUnavailableError');
  });
});

describe('errorHandler', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      get: vi.fn(),
      json: vi.fn().mockReturnValue({}),
      req: { path: '/test' },
      env: { NODE_ENV: 'test' },
    } as any;
  });

  it('should handle AppError', () => {
    const err = new BadRequestError('Invalid input');

    errorHandler(err, mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Invalid input' },
      400
    );
  });

  it('should include requestId if present', () => {
    mockContext.get.mockReturnValue('req-123');
    const err = new NotFoundError();

    errorHandler(err, mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Resource not found', requestId: 'req-123' },
      404
    );
  });

  it('should handle HTTPException', () => {
    const err = new HTTPException(429, { message: 'Too many requests' });

    errorHandler(err, mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Too many requests' },
      429
    );
  });

  it('should handle unknown errors with 500', () => {
    const err = new Error('Unexpected crash');

    errorHandler(err, mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Unexpected crash' },
      500
    );
  });

  it('should hide error details in production', () => {
    mockContext.env = { NODE_ENV: 'production' };
    const err = new Error('Internal details');

    errorHandler(err, mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Internal server error' },
      500
    );
  });

  it('should log warnings for AppError', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = new BadRequestError('Validation failed');

    errorHandler(err, mockContext);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log errors for unhandled exceptions', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Server crash');

    errorHandler(err, mockContext);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
