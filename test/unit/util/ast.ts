import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import {
  buildParameterizedEdgeMap,
  fragmentMapForDocument,
  getOperationOrDie,
  DynamicEdge,
  VariableArgument,
} from '../../../src/util';

describe(`util.ast`, () => {

  describe(`buildDynamicEdgeMap`, () => {

    function buildEdgeMapForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return buildParameterizedEdgeMap(fragmentMap, operation.selectionSet);
    }

    describe(`with no parameterized edges`, () => {

      it(`returns undefined for selections sets with no parameterized edges`, () => {
        const map = buildEdgeMapForOperation(gql`{ foo bar }`);
        expect(map).to.eq(undefined);
      });

      it(`handles fragments without parameterized edges`, () => {
        const map = buildEdgeMapForOperation(gql`
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
        const map = buildEdgeMapForOperation(gql`{
            foo(id:123) {
              a b
            }
          }`);
        expect(map).to.deep.eq({
          foo: new DynamicEdge({ id: 123 }),
        });
      });

      it(`parses queries with sibling edges`, () => {
        const map = buildEdgeMapForOperation(gql`{ foo(id: 123) { a b } bar(id: "asdf") { a b } }`);
        expect(map).to.deep.eq({
          foo: new DynamicEdge({ id: 123 }),
          bar: new DynamicEdge({ id: 'asdf' }),
        });
      });

      it(`handles nested edges`, () => {
        const map = buildEdgeMapForOperation(gql`{
          foo(id: 123) {
            bar(asdf: "fdsa") {
              baz(one: true, two: null) { a b c }
            }
          }
        }`);
        expect(map).to.deep.eq({
          foo: new DynamicEdge({ id: 123 }, /*fieldName*/ undefined, {
            bar: new DynamicEdge({ asdf: 'fdsa' }, /*fieldName*/ undefined, {
              baz: new DynamicEdge({ one: true, two: null }),
            }),
          }),
        });
      });

      it(`properly constructs deeply nested paths`, () => {
        const map = buildEdgeMapForOperation(gql`{
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
                moo: new DynamicEdge({ val: 1.234 }),
              },
            },
          },
        });
      });

      it(`handles edges declared via fragment spreads`, () => {
        const map = buildEdgeMapForOperation(gql`
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
            things: new DynamicEdge({ count: 5 }),
          },
        });
      });

      it(`supports all types of variables`, () => {
        const map = buildEdgeMapForOperation(gql`
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
          foo: new DynamicEdge({
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
        const map = buildEdgeMapForOperation(gql`
          query get($id: ID!) {
            foo(id: $id) { a b c }
          }
        `);
        expect(map).to.deep.eq({
          foo: new DynamicEdge({
            id: new VariableArgument('id'),
          }),
        });
      });

      it(`handles a mix of variables and static values`, () => {
        const map = buildEdgeMapForOperation(gql`
          query get($id: ID!, $val: String) {
            foo(id: $id, foo: "asdf", bar: $id, baz: $val) { a b c }
          }
        `);
        expect(map).to.deep.eq({
          foo: new DynamicEdge({
            id: new VariableArgument('id'),
            foo: 'asdf',
            bar: new VariableArgument('id'),
            baz: new VariableArgument('val'),
          }),
        });
      });

    });

    describe(`with field alias`, () => {

      it(`simple query`, () => {
        const map = buildEdgeMapForOperation(gql`{
            user {
              ID: id
              FirstName: name
            }
          }
        `);
        expect(map).to.deep.eq({
          user: {
            ID: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "id"),
            FirstName: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "name"),
          }
        });
      });

      it(`nested alias`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getUser {
            superUser: user {
              ID: id
              FirstName: name
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            /*parameterizedEdgeArgs*/ undefined,
            /*fiedlName*/ "user",
            {
              ID: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "id"),
              FirstName: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "name"),
            }
          ),
        });
      });

      it(`field alias with parameterized edge`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile {
            superUser: user(id: 4) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            { id: 4 },
            /*fieldName*/ "user",
            {
              ID: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "id"),
              Profile: new DynamicEdge({ width: 400, height: 200 }, /*fieldName*/ "picture"),
            }
          )
        });
      });

      it(`field alias with variable parameterized edge`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile ($id: ID!) {
            superUser: user(id: $id) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            { id: new VariableArgument('id') },
            /*fieldName*/ "user",
            {
              ID: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, /*fiedlName*/ "id"),
              Profile: new DynamicEdge({ width: 400, height: 200 }, /*fieldName*/ "picture"),
            }
          )
        });
      });

      it(`complex nested alias`, () => {
        const map = buildEdgeMapForOperation(gql`{
          shipments(first: 2) {
            shipmentsInfo: edges {
              id
              loads: contents {
                type: shipmentItemType
              }
              shipmentSize: dimensions {
                weight
                unit: weightUnit
              }
            }
          }
        }`);

        expect(map).to.deep.eq({
          shipments: new DynamicEdge(
            { first: 2 },
            /*fieldName*/ undefined, 
            {
              shipmentsInfo: new DynamicEdge(
                /*parameterizedEdgeArgs*/ undefined,
                "edges",
                {
                  loads: new DynamicEdge(
                    /*parameterizedEdgeArgs*/ undefined,
                    "contents",
                    {
                      type: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, "shipmentItemType"),
                    }
                  ),
                  shipmentSize: new DynamicEdge(
                    /*parameterizedEdgeArgs*/ undefined,
                    "dimensions", 
                    {
                      unit: new DynamicEdge(/*parameterizedEdgeArgs*/ undefined, "weightUnit"),
                    }
                  )
                }
              )
            }
          )
        });
      })
    });
  });
});
