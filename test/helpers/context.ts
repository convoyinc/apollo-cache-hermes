import * as util from 'util';

import { CacheContext } from '../../src/context/CacheContext';

export const strictConfig: CacheContext.Configuration = {
  freeze: true,
  logger: {
    debug: jest.fn(),
    warn(message: string, ...args: any[]) {
      throw new Error(util.format(`warn:`, message, ...args));
    },
    error(message: string, ...args: any[]) {
      throw new Error(util.format(`error:`, message, ...args));
    },
    group: jest.fn(),
    groupEnd: jest.fn(),
  },
};

export const silentConfig: CacheContext.Configuration = {
  freeze: true,
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
  },
};

/** Cache context created using strictConfig */
export const strictCacheContext = new CacheContext(strictConfig);
