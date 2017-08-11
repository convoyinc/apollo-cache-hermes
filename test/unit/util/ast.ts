import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import {
  buildParameterizedEdgeMap,
  fragmentMapForDocument,
  getOperationOrDie,
  ParameterizedEdge,
  VariableArgument,
} from '../../../src/util';

describe(`util.ast`, () => {

  describe(`buildParameterizedEdgeMap`, () => {

    function parameterizedEdgesForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return buildParameterizedEdgeMap(fragmentMap, operation.selectionSet);
    }

    describe(`with no parameterized edges`, () => {

      it(`returns undefined for selections sets with no parameterized edges`, () => {
        const map = parameterizedEdgesForOperation(gql`{ foo bar }`);
        expect(map).to.eq(undefined);
      });

      it(`handles fragments without parameterized edges`, () => {
        const map = parameterizedEdgesForOperation(gql`
          query foo { ...bar }

          fragment bar on Foo {
            stuff { ...things }
          }

          fragment things on Stuff { a b c }
        `);
        expect(map).to.eq(undefined);
      });

    });

    describe(`with static arguments`, () => {

      it(`parses top level edges`, () => {
        const map = parameterizedEdgesForOperation(gql`{ foo(id:123) { a b } }`);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({ id: 123 }),
        });
      });

      it(`parses queries with sibling edges`, () => {
        const map = parameterizedEdgesForOperation(gql`{ foo(id: 123) { a b } bar(id: "asdf") { a b } }`);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({ id: 123 }),
          bar: new ParameterizedEdge({ id: 'asdf' }),
        });
      });

      it(`handles nested edges`, () => {
        const map = parameterizedEdgesForOperation(gql`{
          foo(id: 123) {
            bar(asdf: "fdsa") {
              baz(one: true, two: null) { a b c }
            }
          }
        }`);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({ id: 123 }, {
            bar: new ParameterizedEdge({ asdf: 'fdsa' }, {
              baz: new ParameterizedEdge({ one: true, two: null }),
            }),
          }),
        });
      });

      it(`properly constructs deeply nested paths`, () => {
        const map = parameterizedEdgesForOperation(gql`{
          foo {
            fizz {
              buzz {
                moo(val: 1.234) { a b c }
              }
            }
          }
        }`);
        expect(map).to.deep.eq({
          foo: {
            fizz: {
              buzz: {
                moo: new ParameterizedEdge({ val: 1.234 }),
              },
            },
          },
        });
      });

      it(`handles edges declared via fragment spreads`, () => {
        const map = parameterizedEdgesForOperation(gql`
          fragment bar on Foo {
            stuff { ...things }
          }

          query foo { ...bar }

          fragment things on Stuff {
            things(count: 5) { id value }
          }
        `);

        expect(map).to.deep.eq({
          stuff: {
            things: new ParameterizedEdge({ count: 5 }),
          },
        });
      });

      it(`supports all types of variables`, () => {
        const map = parameterizedEdgesForOperation(gql`
          query typetastic($variable: Custom) {
            foo(
              variable: $variable,
              null: null,
              int: 123,
              float: 1.23,
              string: "foo",
              list: [$variable, null, 123, 1.23, "foo", { a: "b" }],
              object: {
                variable: $variable,
                null: null,
                int: 123,
                float: 1.23,
                string: "foo",
                list: [$variable, null, 123, 1.23, "foo", { a: "b" }],
              },
            ) { a }
          }
        `);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({
            variable: new VariableArgument('variable'),
            null: null,
            int: 123,
            float: 1.23,
            string: 'foo',
            list: [new VariableArgument('variable'), null, 123, 1.23, 'foo', { a: 'b' }],
            object: {
              variable: new VariableArgument('variable'),
              null: null,
              int: 123,
              float: 1.23,
              string: 'foo',
              list: [new VariableArgument('variable'), null, 123, 1.23, 'foo', { a: 'b' }],
            },
          }),
        });
      });

    });

    describe(`with variables`, () => {

      it(`creates placeholder args for variables`, () => {
        const map = parameterizedEdgesForOperation(gql`
          query get($id: ID!) {
            foo(id: $id) { a b c }
          }
        `);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({
            id: new VariableArgument('id'),
          }),
        });
      });

      it(`handles a mix of variables and static values`, () => {
        const map = parameterizedEdgesForOperation(gql`
          query get($id: ID!, $val: String) {
            foo(id: $id, foo: "asdf", bar: $id, baz: $val) { a b c }
          }
        `);
        expect(map).to.deep.eq({
          foo: new ParameterizedEdge({
            id: new VariableArgument('id'),
            foo: 'asdf',
            bar: new VariableArgument('id'),
            baz: new VariableArgument('val'),
          }),
        });
      });

    });

  });

});
