import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockPrismaDisconnect = jest.fn();
const mockRedisQuit = jest.fn();
const mockServerClose = jest.fn((cb: () => void) => cb());
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../../../src/lib/prisma.js', () => ({
  __esModule: true,
  default: { $disconnect: (...args: any[]) => mockPrismaDisconnect(...args) },
}));

jest.mock('../../../src/lib/redis.js', () => ({
  __esModule: true,
  redis: { quit: (...args: any[]) => mockRedisQuit(...args) },
  default: { quit: (...args: any[]) => mockRedisQuit(...args) },
}));

jest.mock('../../../src/lib/logger.js', () => ({
  __esModule: true,
  logger: {
    info: (...args: any[]) => mockLoggerInfo(...args),
    error: (...args: any[]) => mockLoggerError(...args),
    warn: jest.fn(),
  },
}));

describe('Graceful Shutdown', () => {
  const originalProcessOn = process.on.bind(process);
  const processListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
    processListeners.clear();

    // Intercept process.on to capture handlers
    jest.spyOn(process, 'on').mockImplementation((event: string, handler: (...args: any[]) => void) => {
      if (!processListeners.has(event)) {
        processListeners.set(event, []);
      }
      processListeners.get(event)!.push(handler);
      return process;
    });

    jest.spyOn(process, 'exit').mockImplementation((() => {
      // Don't actually exit
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should disconnect Prisma and Redis on SIGTERM', async () => {
    await import('../../../src/server.js');

    const sigtermHandlers = processListeners.get('SIGTERM') || [];
    expect(sigtermHandlers.length).toBeGreaterThanOrEqual(1);

    for (const handler of sigtermHandlers) {
      await handler();
    }

    expect(mockPrismaDisconnect).toHaveBeenCalled();
    expect(mockRedisQuit).toHaveBeenCalled();
    expect(mockServerClose).toHaveBeenCalled();
  });

  it('should disconnect Prisma and Redis on SIGINT', async () => {
    await import('../../../src/server.js');

    const sigintHandlers = processListeners.get('SIGINT') || [];
    expect(sigintHandlers.length).toBeGreaterThanOrEqual(1);

    for (const handler of sigintHandlers) {
      await handler();
    }

    expect(mockPrismaDisconnect).toHaveBeenCalled();
    expect(mockRedisQuit).toHaveBeenCalled();
  });

  it('should log unhandled rejections', async () => {
    await import('../../../src/server.js');

    const unhandledHandlers = processListeners.get('unhandledRejection') || [];
    expect(unhandledHandlers.length).toBeGreaterThanOrEqual(1);

    const testError = new Error('Test rejection');
    for (const handler of unhandledHandlers) {
      handler(testError, Promise.resolve());
    }

    expect(mockLoggerError).toHaveBeenCalled();
  });
});
