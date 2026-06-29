const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function log(level: LogLevel, message: string, ...meta: any[]) {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (meta.length > 0) {
    console.log(`${prefix}: ${message}`, ...meta);
  } else {
    console.log(`${prefix}: ${message}`);
  }
}

export const logger = {
  debug: (message: string, ...meta: any[]) => log('debug', message, ...meta),
  info: (message: string, ...meta: any[]) => log('info', message, ...meta),
  warn: (message: string, ...meta: any[]) => log('warn', message, ...meta),
  error: (message: string, ...meta: any[]) => log('error', message, ...meta),
};
