import * as util from 'util';

import { CacheContext } from '../../src/context/CacheContext';

export const strictConfig: CacheContext.Configuration = {
  freeze: true,
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn(message: string, ...args: any[]) {
      throw new Error(util.format(`warn:`, message, ...args));
    },
    group: jest.fn(),
    groupEnd: jest.fn(),
  },
};

export const silentConfig: CacheContext.Configuration = {
  freeze: true,
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
  },
};

/** Cache context created using strictConfig */
export function createStrictCacheContext() {
  return new CacheContext(strictConfig);
}
