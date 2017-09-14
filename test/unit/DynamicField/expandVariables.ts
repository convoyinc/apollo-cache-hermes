import gql from 'graphql-tag';

import { QueryInfo } from '../../../src/context';
import { DynamicField, expandVariables } from '../../../src/DynamicField';

describe(`DynamicField.expandVariables`, () => {

  function makeFieldMap(query: string) {
    return new QueryInfo(gql(query)).rawDynamicFieldMap;
  }

  it(`passes undefined through`, () => {
    expect(expandVariables(undefined, undefined)).to.eq(undefined);
  });

  it(`handles static queries`, () => {
    const map = makeFieldMap(`
      query stuff {
        foo(limit: 5) {
          bar(tag: "hello")
        }
        baz(thing: null)
      }
    `);

    expect(expandVariables(map, undefined)).to.deep.eq({
      foo: new DynamicField({ limit: 5 }, undefined, {
        bar: new DynamicField({ tag: 'hello' }),
      }),
      baz: new DynamicField({ thing: null }),
    });
  });

  it(`replaces top level variables`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    expect(expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
      thing: new DynamicField({ a: 123, b: 'ohai' }),
    });
  });

  it(`replaces top level variables of nested fields`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        one {
          two(a: $foo) {
            three {
              four(b: $bar)
            }
          }
        }
      }
    `);

    expect(expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
      one: {
        two: new DynamicField({ a: 123 }, undefined, {
          three: {
            four: new DynamicField({ b: 'ohai' }),
          },
        }),
      },
    });
  });

  it(`replaces nested variables`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(one: { two: $bar, three: [1, 2, $foo] })
      }
    `);

    expect(expandVariables(map, { foo: 123, bar: 'ohai' })).to.deep.eq({
      thing: new DynamicField({ one: { two: 'ohai', three: [1, 2, 123] } }),
    });
  });

  it(`asserts that variables are provided when passed undefined`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    expect(() => {
      expandVariables(map, undefined);
    }).to.throw(/\$(foo|bar)/);
  });

  it(`asserts that variables are provided`, () => {
    const map = makeFieldMap(`
      query stuff($foo: ID!, $bar: String) {
        thing(a: $foo, b: $bar)
      }
    `);

    expect(() => {
      expandVariables(map, { foo: 123 });
    }).to.throw(/\$bar/);
  });

});
