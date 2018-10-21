import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { ParsedQueryNode, parseQuery, VariableArgument } from '../../../src/ParsedQueryNode';
import { JsonScalar } from '../../../src/primitive';
import { fragmentMapForDocument, getOperationOrDie } from '../../../src/util';
import { strictConfig } from '../../helpers';

describe(`parseQuery for queries with fragments`, () => {

  const context = new CacheContext(strictConfig);
  function parseOperation(operationString: string) {
    const document = gql(operationString);
    const operation = getOperationOrDie(document);
    const FragmentMap = fragmentMapForDocument(document);
    return parseQuery(context, FragmentMap, operation.selectionSet);
  }

  it(`parses queries with static fragments`, () => {
    const operation = `
      query getThings {
        foo { ...aFoo }
      }

      fragment aFoo on Foo {
        id
        name
      }
    `;
    expect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          id: new ParsedQueryNode(),
          name: new ParsedQueryNode(),
        }),
      },
      variables: new Set(),
    });
  });

  it(`parses queries with overlapping fragments`, () => {
    const operation = `
      query getThings {
        foo {
          ...smallFoo
          ...bigFoo
        }
      }

      fragment smallFoo on Foo {
        id
      }

      fragment bigFoo on Foo {
        id
        name
      }
    `;
    expect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          id: new ParsedQueryNode(),
          name: new ParsedQueryNode(),
        }),
      },
      variables: new Set(),
    });
  });

  it(`parses fragments with parameterized fields`, () => {
    const operation = `
      query getThings {
        foo { ...aFoo }
      }

      fragment aFoo on Foo {
        bar(extra: true) {
          baz
        }
      }
    `;
    expect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          bar: new ParsedQueryNode({
            baz: new ParsedQueryNode(),
          }, undefined, { extra: true }),
        }, undefined, undefined, true),
      },
      variables: new Set(),
    });
  });

  it(`parses fragments with variables`, () => {
    const operation = `
      query getThings($count: Int) {
        foo { ...aFoo }
      }

      fragment aFoo on Foo {
        bar(limit: $count) {
          baz
        }
      }
    `;
    expect(parseOperation(operation)).toEqual({
      parsedQuery: {
        foo: new ParsedQueryNode({
          bar: new ParsedQueryNode<JsonScalar | VariableArgument>({
            baz: new ParsedQueryNode(),
          }, undefined, { limit: new VariableArgument('count') }),
        }, undefined, undefined, true),
      },
      variables: new Set(['count']),
    });
  });

  it(`complains if fragments are not declared`, () => {
    const operation = `
      query getThings {
        foo { ...aFoo }
      }
    `;
    expect(() => {
      parseOperation(operation);
    }).toThrow(/aFoo/i);
  });

  it(`complains if parameters do not match`, () => {
    const operation = `
      query getThings {
        foo {
          ...fooOne
          ...fooTwo
        }
      }

      fragment fooOne on Foo {
        bar(limit: 1)
      }

      fragment fooTwo on Foo {
        bar(limit: 2)
      }
    `;
    expect(() => {
      parseOperation(operation);
    }).toThrow(/foo\.bar/i);
  });

  it(`complains if aliases do not match`, () => {
    const operation = `
      query getThings {
        foo {
          ...fooOne
          ...fooTwo
        }
      }

      fragment fooOne on Foo {
        bar: fizz
      }

      fragment fooTwo on Foo {
        bar: buzz
      }
    `;
    expect(() => {
      parseOperation(operation);
    }).toThrow(/foo\.bar/i);
  });

});
