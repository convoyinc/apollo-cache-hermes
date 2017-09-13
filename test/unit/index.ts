import { Hermes, Cache } from '../../src';

describe(`apollo-cache-hermes`, () => {

  it(`exports Hermes as the default export`, () => {
    expect(Hermes).to.be.a('function');
  });

  it(`exports Cache`, () => {
    expect(Cache).to.be.a('function');
  });

});
