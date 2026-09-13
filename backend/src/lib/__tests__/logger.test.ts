import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setLogLevel, logger } from '../logger.js';

describe('logger', () => {
  beforeEach(() => {
    setLogLevel('info');
    vi.restoreAllMocks();
  });

  it('logs info, warn, and error at the default level but not debug', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    logger.debug('quiet');
    logger.info('hello');
    logger.warn('careful');
    logger.error('boom');

    const messages = spy.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes('hello'))).toBe(true);
    expect(messages.some((m) => m.includes('careful'))).toBe(true);
    expect(messages.some((m) => m.includes('boom'))).toBe(true);
    expect(messages.some((m) => m.includes('quiet'))).toBe(false);
  });

  it('logs everything at debug level', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    setLogLevel('debug');

    logger.debug('loud');

    expect(spy).toHaveBeenCalled();
    expect(String(spy.mock.calls[0][0])).toContain('loud');
  });

  it('forwards metadata arguments to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const meta = { requestId: 'r1' };

    logger.info('with-meta', meta);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('with-meta'), meta);
  });

  it('suppresses everything below the error level', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    setLogLevel('error');

    logger.info('hidden');
    logger.warn('hidden');
    logger.error('shown');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('shown');
  });
});
