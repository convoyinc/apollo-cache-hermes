import { CacheContext } from '../../../../src/context/CacheContext';

describe(`context.CacheContext`, () => {
  describe(`entityIdForNode`, () => {
    describe(`default behavior`, () => {

      let context: CacheContext;
      beforeAll(() => {
        context = new CacheContext();
      });

      it(`emits the id property from nodes`, () => {
        expect(context.entityIdForValue({ id: 'hello' })).toBe('hello');
      });

      it(`coerces numbers to strings`, () => {
        expect(context.entityIdForValue({ id: 123 })).toBe('123');
      });

      it(`treats all other types as undefined`, () => {
        expect(context.entityIdForValue({ id: true })).toBe(undefined);
        expect(context.entityIdForValue({ id: false })).toBe(undefined);
        expect(context.entityIdForValue({ id: null })).toBe(undefined);
        expect(context.entityIdForValue({ id: undefined } as any)).toBe(undefined);
        expect(context.entityIdForValue({ id: Symbol.iterator } as any)).toBe(undefined);
        expect(context.entityIdForValue({ id: {} })).toBe(undefined);
        expect(context.entityIdForValue({ id() {} } as any)).toBe(undefined);
        expect(context.entityIdForValue({ id: { id: 'hi' } })).toBe(undefined);
        expect(context.entityIdForValue({ id: [] })).toBe(undefined);
        expect(context.entityIdForValue({ id: ['hi'] })).toBe(undefined);
      });

      it(`ignores nodes that lack an id property`, () => {
        expect(context.entityIdForValue(undefined as any)).toBe(undefined);
        expect(context.entityIdForValue({})).toBe(undefined);
        expect(context.entityIdForValue({ idd: 'hi' })).toBe(undefined);
        expect(context.entityIdForValue([] as any)).toBe(undefined);
        expect(context.entityIdForValue((() => {}) as any)).toBe(undefined);
      });

    });

    describe(`custom mapper`, () => {

      let context: CacheContext, mapper: jest.Mock<any>;
      beforeAll(() => {
        mapper = jest.fn();
        context = new CacheContext({
          entityIdForNode: mapper,
        });
      });

      it(`passes the value through if it's a string`, () => {
        mapper.mockReturnValueOnce('abc123');
        expect(context.entityIdForValue({})).toBe('abc123');
      });

      it(`coerces numbers to strings`, () => {
        mapper.mockReturnValueOnce(1.2);
        expect(context.entityIdForValue({})).toBe('1.2');
      });

      it(`treats other types as undefined`, () => {
        mapper.mockReturnValueOnce(true);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(false);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(null);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(undefined);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(Symbol.iterator);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce({});
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(() => {});
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce({ id: 'hi' });
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce([]);
        expect(context.entityIdForValue({})).toBe(undefined);
        mapper.mockReturnValueOnce(['hi']);
        expect(context.entityIdForValue({})).toBe(undefined);
      });
    });
  });
});
