import { Hermes, Cache } from '../../src';

describe(`apollo-cache-hermes`, () => {

  it(`exports Hermes as the default export`, () => {
    expect(Hermes).toBeInstanceOf(Function);
  });

  it(`exports Cache`, () => {
    expect(Cache).toBeInstanceOf(Function);
  });

});
