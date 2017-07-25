import * as chai from 'chai';

declare global {
  const expect: typeof chai.expect;

  namespace NodeJS {
    export interface Global {
      expect: typeof chai.expect;
    }
  }
}
