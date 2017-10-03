import { SelectionSetNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { CacheContext } from '../../../../src/context/CacheContext';

describe(`context.CacheContext`, () => {
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
      const parsed = context.parseOperation({
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
      const parsed = context.parseOperation({
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
      const parsed = context.parseOperation({
        rootId: 'abc',
        document: gql`
          query stuff {
            foo {
              __typename
              ...fullFoo
            }
          }

          fragment fullFoo on Foo { bar }
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
      const parsed = context.parseOperation({
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
});
