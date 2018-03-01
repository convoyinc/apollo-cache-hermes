import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { parseQuery } from '../../../src/ParsedQueryNode';
import { fragmentMapForDocument, getOperationOrDie } from '../../../src/util';
import { strictConfig } from '../../helpers';

describe(`parseQuery with queries with directives`, () => {

  const context = new CacheContext(strictConfig);
  function parseOperation(operationString: string) {
    const document = gql(operationString);
    const operation = getOperationOrDie(document);
    const FragmentMap = fragmentMapForDocument(document);
    return parseQuery(context, FragmentMap, operation.selectionSet);
  }

  it(`collects variables in directives on fields`, () => {
    const operation = `{
      foo {
        bar @simple(arg: $varA)
        baz(bat: "bad") @complex(arg0: $varB, arg1: $varC)
      }
    }`;
    expect(parseOperation(operation).variables).to.deep.eq(
      new Set(['varA', 'varB', 'varC'])
    );
  });

  it(`collects variables in directives in and on fragments`, () => {
    const operation = `
      query getThings {
        foo {
          ...smallFoo @simple(arg0: $varD)
          ...bigFoo
        }
      }

      fragment smallFoo on Foo {
        id
      }

      fragment bigFoo on Foo {
        id @simple(var0: $varA)
        name @complex(arg0: $varB, arg1: $varC)
      }
    `;
    expect(parseOperation(operation).variables).to.deep.eq(
      new Set(['varA', 'varB', 'varC', 'varD'])
    );
  });

  describe('the connection directive', () => {
    it('fails when the directive is passed invalid arguments', () => {
      const tests = [`
        query getThings {
          viewer {
            friends @connection(key: 123) {
              name
              email
              mobile
            }
          }
        }
      `, `
        query getThings {
          viewer {
            friends @connection(filter: "wowie zowie") {
              name
              email
              mobile
            }
          }
        }
      `, `
        query getThings {
          viewer {
            friends @connection(someRandomArgs: "wowie zowie") {
              name
              email
              mobile
            }
          }
        }
      `, `
        query getThings {
          viewer {
            friends @connection {
              name
              email
              mobile
            }
          }
        }
      `];
      tests.forEach(test => expect(() => parseOperation(test)).to.throw(Error));
    });

    it(`ignores arguments and caches at the given key`, () => {
      const operation1 = `
        query getThings {
          viewer {
            friends(first: 50, after: "id") @connection(key: "friends") {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation2 = `
        query getThings {
          viewer {
            friends(first: 50, after: "id3") @connection(key: "friends") {
              name
              email
              mobile
            }
          }
        }
      `;
      expect(parseOperation(operation1)).to.deep.eq(parseOperation(operation2));
    });

    it(`caches by the key argument`, () => {
      const operation1 = `
        query FriendsQuery {
          viewer {
            friends(first: 50, after: "id") @connection(key: "friends") {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation2 = `
        query FriendsQuery {
          viewer {
            friends(first: 50, after: "id3") @connection(key: "friend") {
              name
              email
              mobile
            }
          }
        }
      `;
      expect(parseOperation(operation1)).to.not.deep.eq(parseOperation(operation2));
    });

    it(`caches by the combination of key and filter`, () => {
      const operation1 = `
        query FriendsQuery {
          viewer {
            friends(onlyCloseFriends: true, first: 1) @connection(key: "friends", filter: ["onlyCloseFriends"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation2 = `
        query FriendsQuery {
          viewer {
            friends(onlyCloseFriends: true, first: 2) @connection(key: "friends", filter: ["onlyCloseFriends"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation3 = `
        query FriendsQuery {
          viewer {
            friends(onlyCloseFriends: false, first: 1) @connection(key: "friends", filter: ["onlyCloseFriends"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      expect(parseOperation(operation1)).to.deep.eq(parseOperation(operation2));
      expect(parseOperation(operation1)).to.not.deep.eq(parseOperation(operation3));
    });

    it('caches based on multiple filters', () => {
      const operation1 = `
        query FriendsQuery {
          viewer {
            friends(
              onlyCloseFriends: true,
              attractive: true,
              first: 1
            ) @connection(key: "friends", filter: ["onlyCloseFriends", "attractive"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation2 = `
        query FriendsQuery {
          viewer {
            friends(
              onlyCloseFriends: true,
              attractive: true,
              first: 2
            ) @connection(key: "friends", filter: ["onlyCloseFriends", "attractive"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation3 = `
        query FriendsQuery {
          viewer {
            friends(
              onlyCloseFriends: false,
              attractive: true,
              first: 1
            ) @connection(key: "friends", filter: ["onlyCloseFriends", "attractive"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      const operation4 = `
        query FriendsQuery {
          viewer {
            friends(
              onlyCloseFriends: false,
              attractive: false,
              first: 1
            ) @connection(key: "friends", filter: ["onlyCloseFriends", "attractive"]) {
              name
              email
              mobile
            }
          }
        }
      `;
      expect(parseOperation(operation1)).to.deep.eq(parseOperation(operation2));
      expect(parseOperation(operation1)).to.not.deep.eq(parseOperation(operation3));
      expect(parseOperation(operation1)).to.not.deep.eq(parseOperation(operation4));
      expect(parseOperation(operation3)).to.not.deep.eq(parseOperation(operation4));
    });
  });
});
