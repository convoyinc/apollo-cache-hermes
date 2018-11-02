import { HermesCacheError } from '../../../src';

describe(`errors.CacheError`, () => {

  class ChildError extends HermesCacheError {}

  it(`it can be constructed directly`, () => {
    expect(() => {
      throw new HermesCacheError(`bewm`);
    }).throws(HermesCacheError);
  });

  it(`supports subclasses`, () => {
    const error = new ChildError(`kaboom`);
    expect(error).instanceOf(ChildError);
    expect(error).instanceOf(HermesCacheError);
  });

  it(`injects infoUrls if requested`, () => {
    const error = new ChildError({ message: `kaboom`, infoUrl: 'http://foo.bar' });
    expect(error.message).to.include('kaboom');
    expect(error.message).to.include('http://foo.bar');
  });

  it(`is ok with message-only details`, () => {
    const error = new ChildError({ message: `kaboom` });
    expect(error.message).to.eq('kaboom');
  });

});
