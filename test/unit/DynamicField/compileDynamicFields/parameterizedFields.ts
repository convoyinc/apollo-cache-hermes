import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { compileDynamicFields, DynamicField, VariableArgument } from '../../../../src/DynamicField';
import { fragmentMapForDocument, getOperationOrDie } from '../../../../src/util';

describe(`DynamicField`, () => {
  describe(`compileDynamicFields`, () => {
    function compileDynamicFieldsForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return compileDynamicFields(fragmentMap, operation.selectionSet);
    }

    describe(`with no parameterized fields`, () => {

      it(`returns undefined for selections sets with no parameterized fields`, () => {
        const map = compileDynamicFieldsForOperation(gql`{ foo bar }`);
        expect(map).to.deep.eq({ fieldMap: undefined, variables: new Set() });
      });

      it(`handles fragments without parameterized fields`, () => {
        const map = compileDynamicFieldsForOperation(gql`
          query foo { ...bar }

          fragment bar on Foo {
            stuff { ...things }
          }

          fragment things on Stuff { a b c }
        `);
        expect(map).to.deep.eq({ fieldMap: undefined, variables: new Set() });
      });
    });

    describe(`with static arguments`, () => {
      it(`parses top level fields`, () => {
        const map = compileDynamicFieldsForOperation(gql`{
            foo(id:123) {
              a b
            }
          }`);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: new DynamicField({ id: 123 }),
          },
          variables: new Set(),
        });
      });

      it(`parses queries with sibling fields`, () => {
        const map = compileDynamicFieldsForOperation(gql`{
          foo(id: 123) {
            a b
          }
          bar(id: "asdf") {
            a b
          }
        }`);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: new DynamicField({ id: 123 }),
            bar: new DynamicField({ id: 'asdf' }),
          },
          variables: new Set(),
        });
      });

      it(`handles nested fields`, () => {
        const map = compileDynamicFieldsForOperation(gql`{
          foo(id: 123) {
            bar(asdf: "fdsa") {
              baz(one: true, two: null) { a b c }
            }
          }
        }`);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: new DynamicField({ id: 123 }, /* fieldName */ undefined, {
              bar: new DynamicField({ asdf: 'fdsa' }, /* fieldName */ undefined, {
                baz: new DynamicField({ one: true, two: null }),
              }),
            }),
          },
          variables: new Set(),
        });
      });

      it(`properly constructs deeply nested paths`, () => {
        const map = compileDynamicFieldsForOperation(gql`{
          foo {
            fizz {
              buzz {
                moo(val: 1.234) { a b c }
              }
            }
          }
        }`);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: {
              fizz: {
                buzz: {
                  moo: new DynamicField({ val: 1.234 }),
                },
              },
            },
          },
          variables: new Set(),
        });
      });

      it(`handles fields declared via fragment spreads`, () => {
        const map = compileDynamicFieldsForOperation(gql`
          fragment bar on Foo {
            stuff { ...things }
          }

          query foo { ...bar }

          fragment things on Stuff {
            things(count: 5) { id value }
          }
        `);

        expect(map).to.deep.eq({
          fieldMap: {
            stuff: {
              things: new DynamicField({ count: 5 }),
            },
          },
          variables: new Set(),
        });
      });

      it(`supports all types of variables`, () => {
        const map = compileDynamicFieldsForOperation(gql`
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
          fieldMap: {
            foo: new DynamicField({
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
          },
          variables: new Set(['variable']),
        });
      });
    });

    describe(`with variables`, () => {

      it(`creates placeholder args for variables`, () => {
        const map = compileDynamicFieldsForOperation(gql`
          query get($id: ID!) {
            foo(id: $id) { a b c }
          }
        `);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: new DynamicField({
              id: new VariableArgument('id'),
            }),
          },
          variables: new Set(['id']),
        });
      });

      it(`handles a mix of variables and static values`, () => {
        const map = compileDynamicFieldsForOperation(gql`
          query get($id: ID!, $val: String) {
            foo(id: $id, foo: "asdf", bar: $id, baz: $val) {
              a b c
            }
          }
        `);
        expect(map).to.deep.eq({
          fieldMap: {
            foo: new DynamicField({
              id: new VariableArgument('id'),
              foo: 'asdf',
              bar: new VariableArgument('id'),
              baz: new VariableArgument('val'),
            }),
          },
          variables: new Set(['id', 'val']),
        });
      });

    });
  });
});
