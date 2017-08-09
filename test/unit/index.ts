import * as apolloCacheHermes from '../../src';

describe(`apollo-cache-hermes`, () => {

  it(`exports ApolloCache`, () => {
    expect(apolloCacheHermes.ApolloCache).to.be.a('function');
  });

  it(`exports Cache`, () => {
    expect(apolloCacheHermes.Cache).to.be.a('function');
  });

});
