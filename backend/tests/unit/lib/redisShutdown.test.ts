import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock('ioredis', () => {
  function MockRedis() {
    return { on: jest.fn(), quit: jest.fn() };
  }
  MockRedis.prototype.on = jest.fn();
  MockRedis.prototype.quit = jest.fn();
  return { default: MockRedis, __esModule: true };
});

jest.mock('../../../src/lib/logger.js', () => ({
  __esModule: true,
  logger: {
    info: (...args: any[]) => mockLoggerInfo(...args),
    warn: (...args: any[]) => mockLoggerWarn(...args),
    error: jest.fn(),
  },
}));

describe('Redis module shutdown', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('should NOT register a SIGTERM handler in redis.ts (shutdown managed by server.ts)', async () => {
    const processOnSpy = jest.spyOn(process, 'on');

    process.env.REDIS_ENABLED = 'true';
    await import('../../../src/lib/redis.js');

    const sigtermCalls = processOnSpy.mock.calls.filter(
      ([event]) => event === 'SIGTERM'
    );
    expect(sigtermCalls.length).toBe(0);
  });

  it('should log info when redis is disabled', async () => {
    process.env.REDIS_ENABLED = 'false';
    await import('../../../src/lib/redis.js');

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining('Redis disabled')
    );
  });
});
