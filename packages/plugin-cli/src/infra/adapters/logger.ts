/**
 * @module Logger adapter for Plugin Template
 * Wrapper around @kb-labs/core-sys/logging
 */

import { getLogger, type Logger as CoreLogger } from '@kb-labs/core-sys/logging';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;
}

/**
 * Create console logger adapter
 * Uses new unified logging system
 */
export function createConsoleLogger(prefix = 'plugin-template'): Logger {
  const coreLogger = getLogger(`plugin-template:${prefix}`);
  
  return {
    log(level, message, meta) {
      switch (level) {
        case 'debug':
          coreLogger.debug(message, meta);
          break;
        case 'info':
          coreLogger.info(message, meta);
          break;
        case 'warn':
          coreLogger.warn(message, meta);
          break;
        case 'error':
          coreLogger.error(message, meta);
          break;
      }
    }
  };
}


