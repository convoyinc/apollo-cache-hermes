import { SelectionSetNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context/CacheContext';

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
        expect(context.entityIdForNode({ id: undefined })).to.eq(undefined);
        expect(context.entityIdForNode({ id: Symbol.iterator })).to.eq(undefined);
        expect(context.entityIdForNode({ id: {} })).to.eq(undefined);
        expect(context.entityIdForNode({ id() {} })).to.eq(undefined);
        expect(context.entityIdForNode({ id: { id: 'hi' } })).to.eq(undefined);
        expect(context.entityIdForNode({ id: [] })).to.eq(undefined);
        expect(context.entityIdForNode({ id: ['hi'] })).to.eq(undefined);
      });

      it(`ignores nodes that lack an id property`, () => {
        expect(context.entityIdForNode(undefined)).to.eq(undefined);
        expect(context.entityIdForNode({})).to.eq(undefined);
        expect(context.entityIdForNode({ idd: 'hi' })).to.eq(undefined);
        expect(context.entityIdForNode([])).to.eq(undefined);
        expect(context.entityIdForNode(() => {})).to.eq(undefined);
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

  describe(`addTypename`, () => {

    function fieldNames(selectionSet: SelectionSetNode) {
      const names = [] as string[];
      for (const selection of selectionSet.selections) {
        if (selection.kind !== 'Field') continue;
        names.push(selection.name.value);
      }
      return names;
    }

    it(`does not inject __typename by default`, () => {
      const context = new CacheContext({});
      const parsed = context.parseQuery({
        rootId: 'abc',
        document: gql`{
          foo {
            bar { a b }
          }
        }`,
      });

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['bar']);

      const barSelection = fooSelection.selections.find((s: any) => s.name.value === 'bar').selectionSet;
      expect(fieldNames(barSelection)).to.have.members(['a', 'b']);
    });

    it(`injects __typename into parsed queries`, () => {
      const context = new CacheContext({ addTypename: true });
      const parsed = context.parseQuery({
        rootId: 'abc',
        document: gql`{
          foo {
            bar { a b }
          }
        }`,
      });

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['__typename', 'bar']);

      const barSelection = fooSelection.selections.find((s: any) => s.name.value === 'bar').selectionSet;
      expect(fieldNames(barSelection)).to.have.members(['__typename', 'a', 'b']);
    });

    it(`injects __typename into fragments`, () => {
      const context = new CacheContext({ addTypename: true });
      const parsed = context.parseQuery({
        rootId: 'abc',
        document: gql`
          query stuff {
            foo {
              __typename
              ...fullFoo
            }
          }

          fragment fullFoo on Foo {
            bar
          }
        `,
      });

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['__typename']);

      const fullFooSelection = parsed.info.fragmentMap['fullFoo'].selectionSet;
      expect(fieldNames(fullFooSelection)).to.have.members(['__typename', 'bar']);
    });

    it(`injects __typename into inline fragments`, () => {
      const context = new CacheContext({ addTypename: true });
      const parsed = context.parseQuery({
        rootId: 'abc',
        document: gql`{
          asdf {
            ... on Foo { a }
            ... on Bar { b }
          }
        }`,
      });

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['asdf']);

      const asdfSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(asdfSelection)).to.have.members(['__typename']);

      const fooSelection = asdfSelection.selections[0].selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['__typename', 'a']);

      const barSelection = asdfSelection.selections[1].selectionSet;
      expect(fieldNames(barSelection)).to.have.members(['__typename', 'b']);
    });

  });

  describe(`parseQuery`, () => {

    const simpleQuery = gql`{ foo }`;

    it(`memoizes identical queries w/o variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseQuery({ rootId: 'root', document: simpleQuery });
      const parsed2 = context.parseQuery({ rootId: 'root', document: simpleQuery });

      expect(parsed1).to.eq(parsed2);
    });

    it(`memoizes identical queries w/ the same variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseQuery({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseQuery({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });

      expect(parsed1).to.eq(parsed2);
    });

    it(`considers the rootId part of a query's identity`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseQuery({ rootId: 'root1', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseQuery({ rootId: 'root2', document: simpleQuery, variables: { a: 1 } });

      expect(parsed1).to.not.eq(parsed2);
    });

    it(`considers variables part of a query's identity`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseQuery({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseQuery({ rootId: 'root', document: simpleQuery, variables: { a: 2 } });

      expect(parsed1).to.not.eq(parsed2);
    });

    it(`doesn't get tripped up by undefined variables`, () => {
      const context = new CacheContext();
      const parsed1 = context.parseQuery({ rootId: 'root', document: simpleQuery, variables: { a: 1 } });
      const parsed2 = context.parseQuery({ rootId: 'root', document: simpleQuery });

      expect(parsed1).to.not.eq(parsed2);
    });

  });
});
