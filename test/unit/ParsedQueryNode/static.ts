import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { ParsedQueryNode, parseQuery } from '../../../src/ParsedQueryNode';
import { getOperationOrDie } from '../../../src/util';
import { strictConfig } from '../../helpers';

describe(`parseQuery with static queries`, () => {

  const context = new CacheContext(strictConfig);
  function parseOperation(operationString: string) {
    const operation = getOperationOrDie(gql(operationString));
    return parseQuery(context, {}, operation.selectionSet);
  }

  it(`parses single-field queries`, () => {
    expect(parseOperation(`{ foo }`)).to.deep.eq({
      parsedQuery: {
        foo: new ParsedQueryNode(),
      },
      variables: new Set(),
    });
  });

  it(`parses queries with nested fields`, () => {
    const operation = `{
      foo {
        bar { fizz }
        baz { buzz }
      }
    }`;
    expect(parseOperation(operation)).to.deep.eq({
      parsedQuery: {
        foo: new ParsedQueryNode({
          bar: new ParsedQueryNode({
            fizz: new ParsedQueryNode(),
          }),
          baz: new ParsedQueryNode({
            buzz: new ParsedQueryNode(),
          }),
        }),
      },
      variables: new Set(),
    });
  });

  it(`includes a schemaName when a field is aliased`, () => {
    expect(parseOperation(`{ foo: bar }`)).to.deep.eq({
      parsedQuery: {
        foo: new ParsedQueryNode(undefined, 'bar'),
      },
      variables: new Set(),
    });
  });

  it(`supports multiple aliases of the same field`, () => {
    const operation = `{
      foo: fizz
      bar: fizz
      fizz
    }`;
    expect(parseOperation(operation)).to.deep.eq({
      parsedQuery: {
        foo: new ParsedQueryNode(undefined, 'fizz'),
        bar: new ParsedQueryNode(undefined, 'fizz'),
        fizz: new ParsedQueryNode(),
      },
      variables: new Set(),
    });
  });

});
