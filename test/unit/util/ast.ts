import gql from 'graphql-tag';

import { ParameterizedEdge, parameterizedEdgesForOperation } from '../../../src/util';

describe(`util.ast`, () => {

  describe(`parameterizedEdgesForSelection`, () => {

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

    });

    describe(`with variables`, () => {

    });

  });

});
