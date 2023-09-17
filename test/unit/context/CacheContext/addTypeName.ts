import { SelectionSetNode } from 'graphql';
import gql from 'graphql-tag';

import { CacheContext } from '../../../../src/context/CacheContext';
import { silentConfig, strictConfig } from '../../../helpers';

describe(`context.CacheContext`, () => {
  describe(`addTypename`, () => {
    function transformDocument(context: CacheContext, operation: string) {
      return context.parseOperation({
        rootId: 'abc',
        document: context.transformDocument(gql(operation)),
      });
    }

    function fieldNames(selectionSet: SelectionSetNode) {
      const names = [] as string[];
      for (const selection of selectionSet.selections) {
        if (selection.kind !== 'Field') continue;
        names.push(selection.name.value);
      }
      return names;
    }

    it(`does not inject __typename`, () => {
      const context = new CacheContext({ ...strictConfig, addTypename: false });
      const parsed = transformDocument(context, `{
        foo {
          bar { a b }
        }
      }`);

      expect(context.addTypename).to.eq(false);

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['bar']);

      const barSelection = fooSelection.selections.find((s: any) => s.name.value === 'bar').selectionSet;
      expect(fieldNames(barSelection)).to.have.members(['a', 'b']);
    });

    it(`injects __typename into parsed queries`, () => {
      const context = new CacheContext({ ...strictConfig, addTypename: true });
      const parsed = transformDocument(context, `{
        foo {
          bar { a b }
        }
      }`);

      expect(context.addTypename).to.eq(true);

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['__typename', 'bar']);

      const barSelection = fooSelection.selections.find((s: any) => s.name.value === 'bar').selectionSet;
      expect(fieldNames(barSelection)).to.have.members(['__typename', 'a', 'b']);
    });

    it(`injects __typename into fragments`, () => {
      const context = new CacheContext({ ...strictConfig, addTypename: true });
      const parsed = transformDocument(context, `
        query stuff {
          foo {
            __typename
            ...fullFoo
          }
        }

        fragment fullFoo on Foo { bar }
      `);

      const rootSelection = parsed.info.operation.selectionSet;
      expect(fieldNames(rootSelection)).to.have.members(['foo']);

      const fooSelection = (rootSelection.selections[0] as any).selectionSet;
      expect(fieldNames(fooSelection)).to.have.members(['__typename']);

      const fullFooSelection = parsed.info.fragmentMap['fullFoo'].selectionSet;
      expect(fieldNames(fullFooSelection)).to.have.members(['__typename', 'bar']);
    });

    it(`injects __typename into inline fragments`, () => {
      const context = new CacheContext({ ...silentConfig, addTypename: true });
      const parsed = transformDocument(context, `{
        asdf {
        ... on Foo { a }
        ... on Bar { b }
          }
      }`);

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
});
