import * as util from 'util';

import { CacheContext } from '../../src/context/CacheContext';

export const strictConfig: CacheContext.Configuration = {
  logger: {
    warn(message: string, ...args: any[]) {
      throw new Error(util.format(`warn:`, message, ...args));
    },
    error(message: string, ...args: any[]) {
      throw new Error(util.format(`error:`, message, ...args));
    },
  },
};

export const silentConfig: CacheContext.Configuration = {
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
};
