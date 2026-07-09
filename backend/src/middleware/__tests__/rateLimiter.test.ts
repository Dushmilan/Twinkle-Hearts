import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import { apiLimiter, orderRateLimit } from '../rateLimiter.js';

function createMockContext(overrides: any = {}): any {
  return {
    req: {
      header: vi.fn(() => '127.0.0.1'),
    },
    env: {
      KV: {
        get: vi.fn(),
        put: vi.fn(),
      },
    },
    get: vi.fn(),
    ...overrides,
  };
}

describe('apiLimiter', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it('should allow request under limit', async () => {
    mockContext.env.KV.get.mockResolvedValue('50');
    mockContext.env.KV.put.mockResolvedValue(undefined);

    await apiLimiter(mockContext, nextFn);

    expect(mockContext.env.KV.put).toHaveBeenCalledWith(
      expect.stringContaining('ratelimit:api:'),
      '51',
      expect.objectContaining({ expirationTtl: 900 })
    );
    expect(nextFn).toHaveBeenCalled();
  });

  it('should throw 429 when limit exceeded', async () => {
    mockContext.env.KV.get.mockResolvedValue('100');

    await expect(apiLimiter(mockContext, nextFn)).rejects.toThrow(HTTPException);
    await expect(apiLimiter(mockContext, nextFn)).rejects.toThrow('Too many requests');
  });

  it('should start counting from 0 for first request', async () => {
    mockContext.env.KV.get.mockResolvedValue(null);

    await apiLimiter(mockContext, nextFn);

    expect(mockContext.env.KV.put).toHaveBeenCalledWith(
      expect.any(String),
      '1',
      expect.any(Object)
    );
    expect(nextFn).toHaveBeenCalled();
  });

  it('should not block on KV error', async () => {
    mockContext.env.KV.get.mockRejectedValue(new Error('KV unavailable'));

    await apiLimiter(mockContext, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });
});

describe('orderRateLimit', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it('should use userId as identifier when authenticated', async () => {
    mockContext.get.mockReturnValue({ userId: 'user-1' });
    mockContext.env.KV.get.mockResolvedValue(null);

    await orderRateLimit(mockContext, nextFn);

    expect(mockContext.env.KV.put).toHaveBeenCalledWith(
      expect.stringContaining('user-1'),
      '1',
      expect.any(Object)
    );
    expect(nextFn).toHaveBeenCalled();
  });

  it('should use IP as identifier when not authenticated', async () => {
    mockContext.get.mockReturnValue(undefined);
    mockContext.env.KV.get.mockResolvedValue(null);

    await orderRateLimit(mockContext, nextFn);

    expect(mockContext.env.KV.put).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1'),
      '1',
      expect.any(Object)
    );
    expect(nextFn).toHaveBeenCalled();
  });

  it('should throw 429 when order limit exceeded', async () => {
    mockContext.get.mockReturnValue({ userId: 'user-1' });
    mockContext.env.KV.get.mockResolvedValue('5');

    await expect(orderRateLimit(mockContext, nextFn)).rejects.toThrow(HTTPException);
    await expect(orderRateLimit(mockContext, nextFn)).rejects.toThrow('Too many order attempts');
  });

  it('should not block on KV error', async () => {
    mockContext.get.mockReturnValue({ userId: 'user-1' });
    mockContext.env.KV.get.mockRejectedValue(new Error('KV error'));

    await orderRateLimit(mockContext, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });
});
