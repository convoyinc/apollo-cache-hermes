import { CacheContext } from '../../../../src/context/CacheContext';

describe(`context.CacheContext`, () => {
  describe(`entityIdForNode`, () => {
    describe(`default behavior`, () => {

      let context: CacheContext;
      beforeAll(() => {
        context = new CacheContext();
      });

      it(`emits the id property from nodes`, () => {
        expect(context.entityIdForNode({ id: 'hello' })).to.eq('hello');
      });

      it(`coerces numbers to strings`, () => {
        expect(context.entityIdForNode({ id: 123 })).to.eq('123');
      });

      it(`treats all other types as undefined`, () => {
        expect(context.entityIdForNode({ id: true })).to.eq(undefined);
        expect(context.entityIdForNode({ id: false })).to.eq(undefined);
        expect(context.entityIdForNode({ id: null })).to.eq(undefined);
        expect(context.entityIdForNode({ id: undefined } as any)).to.eq(undefined);
        expect(context.entityIdForNode({ id: Symbol.iterator } as any)).to.eq(undefined);
        expect(context.entityIdForNode({ id: {} })).to.eq(undefined);
        expect(context.entityIdForNode({ id() {} } as any)).to.eq(undefined);
        expect(context.entityIdForNode({ id: { id: 'hi' } })).to.eq(undefined);
        expect(context.entityIdForNode({ id: [] })).to.eq(undefined);
        expect(context.entityIdForNode({ id: ['hi'] })).to.eq(undefined);
      });

      it(`ignores nodes that lack an id property`, () => {
        expect(context.entityIdForNode(undefined as any)).to.eq(undefined);
        expect(context.entityIdForNode({})).to.eq(undefined);
        expect(context.entityIdForNode({ idd: 'hi' })).to.eq(undefined);
        expect(context.entityIdForNode([] as any)).to.eq(undefined);
        expect(context.entityIdForNode((() => {}) as any)).to.eq(undefined);
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
        expect(context.entityIdForNode({})).to.eq('abc123');
      });

      it(`coerces numbers to strings`, () => {
        mapper.mockReturnValueOnce(1.2);
        expect(context.entityIdForNode({})).to.eq('1.2');
      });

      it(`treats other types as undefined`, () => {
        mapper.mockReturnValueOnce(true);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(false);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(null);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(undefined);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(Symbol.iterator);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce({});
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(() => {});
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce({ id: 'hi' });
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce([]);
        expect(context.entityIdForNode({})).to.eq(undefined);
        mapper.mockReturnValueOnce(['hi']);
        expect(context.entityIdForNode({})).to.eq(undefined);
      });
    });
  });
});
