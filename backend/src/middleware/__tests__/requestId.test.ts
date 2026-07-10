import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestId } from '../requestId.js';

describe('requestId middleware', () => {
  let mockContext: any;
  const nextFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      set: vi.fn(),
      header: vi.fn(),
    };
  });

  it('should set a request ID on context', async () => {
    await requestId(mockContext, nextFn);

    expect(mockContext.set).toHaveBeenCalledWith('requestId', expect.any(String));
    expect(mockContext.header).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    expect(nextFn).toHaveBeenCalled();
  });

  it('should generate unique IDs for each request', async () => {
    const ids: string[] = [];

    for (let i = 0; i < 10; i++) {
      const ctx: any = { set: vi.fn(), header: vi.fn() };
      await requestId(ctx, vi.fn());
      const id = ctx.set.mock.calls[0][1];
      ids.push(id);
    }

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it('should set the header with generated ID', async () => {
    await requestId(mockContext, nextFn);

    const requestIdValue = mockContext.set.mock.calls[0][1];
    expect(mockContext.header).toHaveBeenCalledWith('X-Request-ID', requestIdValue);
  });
});
