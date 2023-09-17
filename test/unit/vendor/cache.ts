// noinspection GraphQLUnresolvedReference,GraphQLTypeRedefinition

import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import gql, { disableFragmentWarnings } from 'graphql-tag';
import { Cache, isReference, makeReference, Reference, TypePolicies } from '@apollo/client';
import { expectTypeOf } from 'expect-type';
import { DocumentNode } from 'graphql';

import { Hermes } from '../../../src';
import { CacheContext } from '../../../src/context';
import { cloneDeep } from '../../helpers/cloneDeep';

disableFragmentWarnings();

const expect = jestExpect;

describe('Cache', () => {
  function itWithInitialData(
    message: string,
    initialDataForCaches: { [key: string]: any }[],
    callback: (...caches: Hermes[]) => any
  ) {
    const cachesList: Hermes[][] = [
      initialDataForCaches.map(data =>
        new Hermes({
          addTypename: false,
        }).restore(cloneDeep(data))
      ),
      initialDataForCaches.map(data =>
        new Hermes({
          addTypename: false,
        }).restore(cloneDeep(data))
      ),
    ];

    cachesList.forEach((caches, i) => {
      it(`${message} (${i + 1}/${cachesList.length})`, () =>
        callback(...caches));
    });
  }

  function itWithCacheConfig(
    message: string,
    config: CacheContext.Configuration,
    callback: (cache: Hermes) => any
  ) {
    const caches = [
      new Hermes({
        addTypename: false,
        ...config,
      }),
      new Hermes({
        addTypename: false,
        ...config,
      }),
    ];

    caches.forEach((cache, i) => {
      it(`${message} (${i + 1}/${caches.length})`, () => callback(cache));
    });
  }

  describe('readQuery', () => {
    itWithInitialData(
      'will read some data from the store',
      [
        {
          ROOT_QUERY: {
            a: 1,
            b: 2,
            c: 3,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readQuery({
            query: gql`
              {
                a
              }
            `,
          })
        ).toMatchObject({ a: 1 });
        expect(
          proxy.readQuery({
            query: gql`
              {
                b
                c
              }
            `,
          })
        ).toMatchObject({ b: 2, c: 3 });
        expect(
          proxy.readQuery({
            query: gql`
              {
                a
                b
                c
              }
            `,
          })
        ).toMatchObject({ a: 1, b: 2, c: 3 });
      }
    );

    itWithInitialData(
      'will read some deeply nested data from the store',
      [
        {
          ROOT_QUERY: {
            a: 1,
            b: 2,
            c: 3,
            d: makeReference('foo'),
          },
          foo: {
            e: 4,
            f: 5,
            g: 6,
            h: makeReference('bar'),
          },
          bar: {
            i: 7,
            j: 8,
            k: 9,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readQuery({
            query: gql`
              {
                a
                d {
                  e
                }
              }
            `,
          })
        ).toMatchObject({ a: 1, d: { e: 4, h: { i: 7 } } });
        expect(
          proxy.readQuery({
            query: gql`
              {
                a
                d {
                  e
                  h {
                    i
                  }
                }
              }
            `,
          })
        ).toMatchObject({ a: 1, d: { e: 4, h: { i: 7 } } });
        expect(
          proxy.readQuery({
            query: gql`
              {
                a
                b
                c
                d {
                  e
                  f
                  g
                  h {
                    i
                    j
                    k
                  }
                }
              }
            `,
          })
        ).toMatchObject({
          a: 1,
          b: 2,
          c: 3,
          d: { e: 4, f: 5, g: 6, h: { i: 7, j: 8, k: 9 } },
        });
      }
    );

    itWithInitialData(
      'will read some data from the store with variables',
      [
        {
          ROOT_QUERY: {
            'field({"literal":true,"value":42})': 1,
            'field({"literal":false,"value":42})': 2,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readQuery({
            query: gql`
              query ($literal: Boolean, $value: Int) {
                a: field(literal: true, value: 42)
                b: field(literal: $literal, value: $value)
              }
            `,
            variables: {
              literal: false,
              value: 42,
            },
          })
        ).toEqual({ a: 1, b: 2 });
      }
    );

    itWithInitialData(
      'will read some data from the store with null variables',
      [
        {
          ROOT_QUERY: {
            'field({"literal":false,"value":null})': 1,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readQuery({
            query: gql`
              query ($literal: Boolean, $value: Int) {
                a: field(literal: $literal, value: $value)
              }
            `,
            variables: {
              literal: false,
              value: null,
            },
          })
        ).toEqual({ a: 1 });
      }
    );

    itWithInitialData(
      'should not mutate arguments passed in',
      [
        {
          ROOT_QUERY: {
            'field({"literal":true,"value":42})': 1,
            'field({"literal":false,"value":42})': 2,
          },
        },
      ],
      (proxy) => {
        const options = {
          query: gql`
            query ($literal: Boolean, $value: Int) {
              a: field(literal: true, value: 42)
              b: field(literal: $literal, value: $value)
            }
          `,
          variables: {
            literal: false,
            value: 42,
          },
        };

        const preQueryCopy = cloneDeep(options);
        expect(proxy.readQuery(options)).toEqual({ a: 1, b: 2 });
        expect(preQueryCopy).toEqual(options);
      }
    );
  });

  describe('readFragment', () => {
    itWithInitialData(
      'will throw an error when there is no fragment',
      [
        // Empty data, but still want to test with/without result caching.
        {},
      ],
      (proxy) => {
        expect(() => {
          proxy.readFragment({
            id: 'x',
            fragment: gql`
              query {
                a
                b
                c
              }
            `,
          });
        }).toThrowError();
        expect(() => {
          // noinspection GraphQLMemberRedefinition,GraphQLMissingType
          proxy.readFragment({
            id: 'x',
            fragment: gql`
              schema {
                query: Query
              }
            `,
          });
        }).toThrowError();
      }
    );

    itWithInitialData(
      'will throw an error when there is more than one fragment but no fragment name',
      [{}],
      (proxy) => {
        expect(() => {
          proxy.readFragment({
            id: 'x',
            fragment: gql`
              fragment a on A {
                a
              }

              fragment b on B {
                b
              }
            `,
          });
        }).toThrowError();
        expect(() => {
          proxy.readFragment({
            id: 'x',
            fragment: gql`
              fragment a on A {
                a
              }

              fragment b on B {
                b
              }

              fragment c on C {
                c
              }
            `,
          });
        }).toThrowError();
      }
    );

    itWithInitialData(
      'will read some deeply nested data from the store at any id',
      [
        {
          ROOT_QUERY: {
            __typename: 'Type1',
            a: 1,
            b: 2,
            c: 3,
            d: makeReference('foo'),
          },
          foo: {
            __typename: 'Foo',
            e: 4,
            f: 5,
            g: 6,
            h: makeReference('bar'),
          },
          bar: {
            __typename: 'Bar',
            i: 7,
            j: 8,
            k: 9,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fragmentFoo on Foo {
                e
                h {
                  i
                }
              }
            `,
          })
        ).toMatchObject({ e: 4, h: { i: 7 } });
        expect(
          proxy.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fragmentFoo on Foo {
                e
                f
                g
                h {
                  i
                  j
                  k
                }
              }
            `,
          })
        ).toMatchObject({ e: 4, f: 5, g: 6, h: { i: 7, j: 8, k: 9 } });
        expect(
          proxy.readFragment({
            id: 'bar',
            fragment: gql`
              fragment fragmentBar on Bar {
                i
              }
            `,
          })
        ).toMatchObject({ i: 7 });
        expect(
          proxy.readFragment({
            id: 'bar',
            fragment: gql`
              fragment fragmentBar on Bar {
                i
                j
                k
              }
            `,
          })
        ).toMatchObject({ i: 7, j: 8, k: 9 });
        expect(
          proxy.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fragmentFoo on Foo {
                e
                f
                g
                h {
                  i
                  j
                  k
                }
              }

              fragment fragmentBar on Bar {
                i
                j
                k
              }
            `,
            fragmentName: 'fragmentFoo',
          })
        ).toMatchObject({ e: 4, f: 5, g: 6, h: { i: 7, j: 8, k: 9 } });
        expect(
          proxy.readFragment({
            id: 'bar',
            fragment: gql`
              fragment fragmentFoo on Foo {
                e
                f
                g
                h {
                  i
                  j
                  k
                }
              }

              fragment fragmentBar on Bar {
                i
                j
                k
              }
            `,
            fragmentName: 'fragmentBar',
          })
        ).toMatchObject({ i: 7, j: 8, k: 9 });
      }
    );

    itWithInitialData(
      'will read some data from the store with variables',
      [
        {
          foo: {
            __typename: 'Foo',
            'field({"literal":true,"value":42})': 1,
            'field({"literal":false,"value":42})': 2,
          },
        },
      ],
      (proxy) => {
        expect(
          proxy.readFragment({
            id: 'foo',
            fragment: gql`
              fragment foo on Foo {
                a: field(literal: true, value: 42)
                b: field(literal: $literal, value: $value)
              }
            `,
            variables: {
              literal: false,
              value: 42,
            },
          })
        ).toMatchObject({ a: 1, b: 2 });
      }
    );

    itWithInitialData(
      'will return null when an id that can’t be found is provided',
      [
        // client1
        {},
        // client2
        {
          bar: { __typename: 'Bar', a: 1, b: 2, c: 3 },
        },
        // client3
        {
          foo: { __typename: 'Foo', a: 1, b: 2, c: 3 },
        },
      ],
      (client1, client2, client3) => {
        expect(
          client1.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fooFragment on Foo {
                a
                b
                c
              }
            `,
          })
        ).toEqual(null);
        expect(
          client2.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fooFragment on Foo {
                a
                b
                c
              }
            `,
          })
        ).toEqual(null);
        expect(
          client3.readFragment({
            id: 'foo',
            fragment: gql`
              fragment fooFragment on Foo {
                a
                b
                c
              }
            `,
          })
        ).toMatchObject({ a: 1, b: 2, c: 3 });
      }
    );

    it('should not accidentally depend on unrelated entity fields', () => {
      const cache = new Hermes({
      });

      const bothNamesData = {
        __typename: 'Person',
        id: 123,
        firstName: 'Ben',
        lastName: 'Newman',
      };

      const firstNameQuery = gql`
        {
          firstName
        }
      `;
      const lastNameQuery = gql`
        {
          lastName
        }
      `;

      const id = cache.identify(bothNamesData);

      cache.writeQuery({
        id,
        query: firstNameQuery,
        data: bothNamesData,
      });

      expect(cache.extract()).toMatchObject({
        'Person:123': {
          data: {
            __typename: 'Person',
            id: 123,
            firstName: 'Ben',
          },
          type: 0,
        },
      });

      const firstNameResult = cache.readQuery({
        id,
        query: firstNameQuery,
      });

      expect(firstNameResult).toMatchObject({
        __typename: 'Person',
        firstName: 'Ben',
      });

      cache.writeQuery({
        id,
        query: lastNameQuery,
        data: bothNamesData,
      });

      expect(cache.extract()).toMatchObject({
        'Person:123': {
          data: {
            __typename: 'Person',
            id: 123,
            firstName: 'Ben',
            lastName: 'Newman',
          },
          type: 0,
        },
      });

      // This is the crucial test: modifying the lastName field should not
      // invalidate results that did not depend on the lastName field.
      expect(
        cache.readQuery({
          id,
          query: firstNameQuery,
        })
      ).toEqual(firstNameResult);

      const lastNameResult = cache.readQuery({
        id,
        query: lastNameQuery,
      });

      expect(lastNameResult).toMatchObject({
        __typename: 'Person',
        lastName: 'Newman',
      });

      cache.writeQuery({
        id,
        query: firstNameQuery,
        data: {
          ...bothNamesData,
          firstName: 'Benjamin',
        },
      });

      expect(cache.extract()).toMatchObject({
        'Person:123': {
          data: {
            __typename: 'Person',
            id: 123,
            firstName: 'Benjamin',
            lastName: 'Newman',
          },
          type: 0,
        },
      });

      const benjaminResult = cache.readQuery({
        id,
        query: firstNameQuery,
      });

      expect(benjaminResult).toMatchObject({
        __typename: 'Person',
        firstName: 'Benjamin',
      });

      // Still the same as it was?
      expect(firstNameResult).toMatchObject({
        __typename: 'Person',
        firstName: 'Ben',
      });

      // Updating the firstName should not have invalidated the
      // previously-read lastNameResult.
      const { firstName: _, ...lastNameResultWithoutFirstName } = lastNameResult as Record<string, unknown>;
      expect(
        cache.readQuery({
          id,
          query: lastNameQuery,
        })
      ).toMatchObject(lastNameResultWithoutFirstName);
    });

    it('should not return null when ID found in optimistic layer', () => {
      const cache = new Hermes();

      const fragment = gql`
        fragment NameFragment on Person {
          firstName
          lastName
        }
      `;

      const data = {
        __typename: 'Person',
        id: 321,
        firstName: 'Hugh',
        lastName: 'Willson',
      };

      const id = cache.identify(data)!;

      cache.recordOptimisticTransaction((proxy) => {
        proxy.writeFragment({ id, fragment, data });
      }, 'optimistic Hugh');

      expect(cache.extract(false)).toEqual({});
      expect(cache.extract(true)).toMatchObject({
        'Person:321': {
          data: {
            __typename: 'Person',
            id: 321,
            firstName: 'Hugh',
            lastName: 'Willson',
          },
        },
      });

      expect(
        cache.readFragment(
          { id, fragment },
          false // not optimistic
        )
      ).toBe(null);

      expect(
        cache.readFragment(
          { id, fragment },
          true // optimistic
        )
      ).toMatchObject({
        __typename: 'Person',
        firstName: 'Hugh',
        lastName: 'Willson',
      });

      cache.writeFragment({
        id,
        fragment,
        data: {
          ...data,
          firstName: 'HUGH',
          lastName: 'WILLSON',
        },
      });

      expect(
        cache.readFragment(
          { id, fragment },
          false // not optimistic
        )
      ).toMatchObject({
        __typename: 'Person',
        firstName: 'HUGH',
        lastName: 'WILLSON',
      });

      expect(
        cache.readFragment(
          { id, fragment },
          true // optimistic
        )
      ).toMatchObject({
        __typename: 'Person',
        firstName: 'Hugh',
        lastName: 'Willson',
      });

      cache.removeOptimistic('optimistic Hugh');

      expect(
        cache.readFragment(
          { id, fragment },
          true // optimistic
        )
      ).toMatchObject({
        __typename: 'Person',
        firstName: 'HUGH',
        lastName: 'WILLSON',
      });
    });
  });

  describe('writeQuery', () => {
    itWithInitialData('will write some data to the store', [{}], (proxy) => {
      proxy.writeQuery({
        data: { a: 1 },
        query: gql`
          {
            a
          }
        `,
      });

      expect((proxy as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 1,
          },
        },
      });

      proxy.writeQuery({
        data: { b: 2, c: 3 },
        query: gql`
          {
            b
            c
          }
        `,
      });

      expect((proxy as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 1,
            b: 2,
            c: 3,
          },
        },
      });

      proxy.writeQuery({
        data: { a: 4, b: 5, c: 6 },
        query: gql`
          {
            a
            b
            c
          }
        `,
      });

      expect((proxy as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 4,
            b: 5,
            c: 6,
          },
        },
      });
    });

    it('will write some deeply nested data to the store', () => {
      const cache = new Hermes({
        typePolicies: {
          Query: {
            fields: {
              d: {
                // Deliberately silence "Cache data may be lost..."
                // warnings by unconditionally favoring the incoming data.
                merge: false,
              },
            },
          },
        },
      });

      cache.writeQuery({
        data: { a: 1, d: { e: 4 } },
        query: gql`
          {
            a
            d {
              e
            }
          }
        `,
      });

      expect((cache as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 1,
            d: {
              e: 4,
            },
          },
        },
      });

      cache.writeQuery({
        data: { a: 1, d: { h: { i: 7 } } },
        query: gql`
          {
            a
            d {
              h {
                i
              }
            }
          }
        `,
      });

      expect((cache as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 1,
            // The new value for d overwrites the old value, since there
            // is no custom merge function defined for Query.d.
            d: {
              h: {
                i: 7,
              },
            },
          },
        },
      });

      cache.writeQuery({
        data: {
          a: 1,
          b: 2,
          c: 3,
          d: { e: 4, f: 5, g: 6, h: { i: 7, j: 8, k: 9 } },
        },
        query: gql`
          {
            a
            b
            c
            d {
              e
              f
              g
              h {
                i
                j
                k
              }
            }
          }
        `,
      });

      expect((cache as Hermes).extract()).toMatchObject({
        ROOT_QUERY: {
          data: {
            a: 1,
            b: 2,
            c: 3,
            d: {
              e: 4,
              f: 5,
              g: 6,
              h: {
                i: 7,
                j: 8,
                k: 9,
              },
            },
          },
        },
      });
    });

    itWithInitialData(
      'will write some data to the store with variables',
      [{}],
      (proxy) => {
        proxy.writeQuery({
          data: {
            a: 1,
            b: 2,
          },
          query: gql`
            query ($literal: Boolean, $value: Int) {
              a: field(literal: true, value: 42)
              b: field(literal: $literal, value: $value)
            }
          `,
          variables: {
            literal: false,
            value: 42,
          },
        });

        expect((proxy as Hermes).extract()).toEqual({
          'ROOT_QUERY': {
            'outbound': [
              {
                'id': 'ROOT_QUERY❖["field"]❖{"literal":true,"value":42}',
                'path': [
                  'field',
                ],
              },
              {
                'id': 'ROOT_QUERY❖["field"]❖{"literal":false,"value":42}',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 0,
          },
          'ROOT_QUERY❖["field"]❖{"literal":false,"value":42}': {
            'data': 2,
            'inbound': [
              {
                'id': 'ROOT_QUERY',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
          'ROOT_QUERY❖["field"]❖{"literal":true,"value":42}': {
            'data': 1,
            'inbound': [
              {
                'id': 'ROOT_QUERY',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
        });
      }
    );

    itWithInitialData(
      'will write some data to the store with variables where some are null',
      [{}],
      (proxy) => {
        proxy.writeQuery({
          data: {
            a: 1,
            b: 2,
          },
          query: gql`
            query ($literal: Boolean, $value: Int) {
              a: field(literal: true, value: 42)
              b: field(literal: $literal, value: $value)
            }
          `,
          variables: {
            literal: false,
            value: null,
          },
        });

        expect((proxy as Hermes).extract()).toEqual({
          'ROOT_QUERY': {
            'outbound': [
              {
                'id': 'ROOT_QUERY❖["field"]❖{"literal":true,"value":42}',
                'path': [
                  'field',
                ],
              },
              {
                'id': 'ROOT_QUERY❖["field"]❖{"literal":false,"value":null}',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 0,
          },
          'ROOT_QUERY❖["field"]❖{"literal":false,"value":null}': {
            'data': 2,
            'inbound': [
              {
                'id': 'ROOT_QUERY',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
          'ROOT_QUERY❖["field"]❖{"literal":true,"value":42}': {
            'data': 1,
            'inbound': [
              {
                'id': 'ROOT_QUERY',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
        });
      }
    );
  });

  describe('writeFragment', () => {
    itWithInitialData(
      'will throw an error when there is no fragment',
      [{}],
      (proxy) => {
        expect(() => {
          proxy.writeFragment({
            data: {},
            id: 'x',
            fragment: gql`
              query {
                a
                b
                c
              }
            `,
          });
        }).toThrowError();
        expect(() => {
          proxy.writeFragment({
            data: {},
            id: 'x',
            fragment: gql`
              schema {
                query: Query
              }
            `,
          });
        }).toThrowError();
      }
    );

    itWithInitialData(
      'will throw an error when there is more than one fragment but no fragment name',
      [{}],
      (proxy) => {
        expect(() => {
          proxy.writeFragment({
            data: {},
            id: 'x',
            fragment: gql`
              fragment a on A {
                a
              }

              fragment b on B {
                b
              }
            `,
          });
        }).toThrowError();
        expect(() => {
          proxy.writeFragment({
            data: {},
            id: 'x',
            fragment: gql`
              fragment a on A {
                a
              }

              fragment b on B {
                b
              }

              fragment c on C {
                c
              }
            `,
          });
        }).toThrowError();
      }
    );

    itWithCacheConfig(
      'will write some deeply nested data into the store at any id',
      {
        entityIdForNode: (o: any) => o.id,
        addTypename: false,
      },
      (proxy) => {
        proxy.writeFragment({
          data: { __typename: 'Foo', e: 4, h: { id: 'bar', i: 7 } },
          id: 'foo',
          fragment: gql`
            fragment fragmentFoo on Foo {
              e
              h {
                i
              }
            }
          `,
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();
        proxy.writeFragment({
          data: { __typename: 'Foo', f: 5, g: 6, h: { id: 'bar', j: 8, k: 9 } },
          id: 'foo',
          fragment: gql`
            fragment fragmentFoo on Foo {
              f
              g
              h {
                j
                k
              }
            }
          `,
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();

        proxy.writeFragment({
          data: { i: 10, __typename: 'Bar' },
          id: 'bar',
          fragment: gql`
            fragment fragmentBar on Bar {
              i
            }
          `,
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();

        proxy.writeFragment({
          data: { j: 11, k: 12, __typename: 'Bar' },
          id: 'bar',
          fragment: gql`
            fragment fragmentBar on Bar {
              j
              k
            }
          `,
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();

        proxy.writeFragment({
          data: {
            __typename: 'Foo',
            e: 4,
            f: 5,
            g: 6,
            h: { __typename: 'Bar', id: 'bar', i: 7, j: 8, k: 9 },
          },
          id: 'foo',
          fragment: gql`
            fragment fooFragment on Foo {
              e
              f
              g
              h {
                i
                j
                k
              }
            }

            fragment barFragment on Bar {
              i
              j
              k
            }
          `,
          fragmentName: 'fooFragment',
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();

        proxy.writeFragment({
          data: { __typename: 'Bar', i: 10, j: 11, k: 12 },
          id: 'bar',
          fragment: gql`
            fragment fooFragment on Foo {
              e
              f
              g
              h {
                i
                j
                k
              }
            }

            fragment barFragment on Bar {
              i
              j
              k
            }
          `,
          fragmentName: 'barFragment',
        });

        expect((proxy as Hermes).extract()).toMatchSnapshot();
      }
    );

    itWithCacheConfig(
      'writes data that can be read back',
      {
        addTypename: true,
      },
      (proxy) => {
        const readWriteFragment = gql`
          fragment aFragment on Query {
            getSomething {
              id
            }
          }
        `;
        const data = {
          __typename: 'query',
          getSomething: { id: '123', __typename: 'Something' },
        };
        proxy.writeFragment({
          data,
          id: 'query',
          fragment: readWriteFragment,
        });

        const result = proxy.readFragment({
          fragment: readWriteFragment,
          id: 'query',
        });
        expect(result).toEqual(data);
      }
    );

    itWithCacheConfig(
      'will write some data to the store with variables',
      {
        addTypename: true,
      },
      (proxy) => {
        proxy.writeFragment({
          data: {
            a: 1,
            b: 2,
            __typename: 'Foo',
          },
          id: 'foo',
          fragment: gql`
            fragment foo on Foo {
              a: field(literal: true, value: 42)
              b: field(literal: $literal, value: $value)
            }
          `,
          variables: {
            literal: false,
            value: 42,
          },
        });

        expect((proxy as Hermes).extract()).toEqual({
          'foo': {
            'data': {
              '__typename': 'Foo',
            },
            'outbound': [
              {
                'id': 'foo❖["field"]❖{"literal":true,"value":42}',
                'path': [
                  'field',
                ],
              },
              {
                'id': 'foo❖["field"]❖{"literal":false,"value":42}',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 0,
          },
          'foo❖["field"]❖{"literal":false,"value":42}': {
            'data': 2,
            'inbound': [
              {
                'id': 'foo',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
          'foo❖["field"]❖{"literal":true,"value":42}': {
            'data': 1,
            'inbound': [
              {
                'id': 'foo',
                'path': [
                  'field',
                ],
              },
            ],
            'type': 1,
          },
        });
      }
    );
  });

  describe('cache.updateQuery and cache.updateFragment', () => {
    it('should be batched', () => {
      const cache = new Hermes({
        typePolicies: {
          Person: {
            keyFields: ['name'],
          },
        },
      });

      type QueryData = {
        me: {
          __typename: string,
          name: string,
        },
      };

      const query: TypedDocumentNode<QueryData> = gql`
        query {
          me {
            name
          }
        }
      `;
      const results: QueryData[] = [];

      const cancel = cache.watch({
        query,
        optimistic: true,
        callback(diff) {
          results.push(diff.result!);
        },
      });

      cache.updateQuery({ query }, (data) => {
        expect(data).toBe(null);

        cache.writeQuery({
          query,
          data: {
            me: {
              __typename: 'Person',
              name: 'Ben',
            },
          },
        });

        return {
          me: {
            __typename: 'Person',
            name: 'Ben Newman',
          },
        };
      });

      expect(results).toEqual([
        { me: { __typename: 'Person', name: 'Ben Newman' } },
      ]);

      expect(cache.extract()).toEqual({
        'Person:{"name":"Ben Newman"}': {
          'data': {
            '__typename': 'Person',
            'name': 'Ben Newman',
          },
          'inbound': [
            {
              'id': 'ROOT_QUERY',
              'path': [
                'me',
              ],
            },
          ],
          'type': 0,
        }, /*
        'Person:{"name":"Ben"}': {
          'data': {
            '__typename': 'Person',
            'name': 'Ben',
          },
          'type': 0,
        },*/
        'ROOT_QUERY': {
          'data': {
            'me': undefined,
          },
          'outbound': [
            {
              'id': 'Person:{"name":"Ben Newman"}',
              'path': [
                'me',
              ],
            },
          ],
          'type': 0,
        },
      });

      const usernameFragment = gql`
        fragment UsernameFragment on Person {
          username
        }
      `;

      const bnId = cache.identify({
        __typename: 'Person',
        name: 'Ben Newman',
      });

      cache.updateFragment(
        {
          id: bnId,
          fragment: usernameFragment,
          returnPartialData: true,
        },
        (data) => {
          expect(data).toMatchObject({
            __typename: 'Person',
          });

          cache.writeQuery({
            query,
            data: {
              me: {
                __typename: 'Person',
                name: 'Brian Kim',
              },
            },
          });

          cache.writeFragment({
            id: cache.identify({
              __typename: 'Person',
              name: 'Brian Kim',
            }),
            fragment: usernameFragment,
            data: {
              username: 'brainkim',
            },
          });

          expect(results.length).toBe(1);

          return {
            ...data,
            name: 'Ben Newman',
            username: 'benjamn',
          };
        }
      );

      // Still just two results, thanks to cache.update{Query,Fragment} using
      // cache.batch behind the scenes.
      expect(results).toMatchObject([
        { me: { __typename: 'Person', name: 'Ben Newman' } },
        { me: { __typename: 'Person', name: 'Brian Kim' } },
      ]);

      expect(cache.extract()).toEqual({
        'Person:{"name":"Ben Newman"}': {
          'data': {
            '__typename': 'Person',
            'name': 'Ben Newman',
            'username': 'benjamn',
          },
          'type': 0,
        }, /* Hermes does gc by default
        'Person:{"name":"Ben"}': {
          'data': {
            '__typename': 'Person',
            'name': 'Ben',
          },
          'type': 0,
        },*/
        'Person:{"name":"Brian Kim"}': {
          'data': {
            '__typename': 'Person',
            'name': 'Brian Kim',
            'username': 'brainkim',
          },
          'inbound': [
            {
              'id': 'ROOT_QUERY',
              'path': [
                'me',
              ],
            },
          ],
          'type': 0,
        },
        'ROOT_QUERY': {
          'data': {
            'me': undefined,
          },
          'outbound': [
            {
              'id': 'Person:{"name":"Brian Kim"}',
              'path': [
                'me',
              ],
            },
          ],
          'type': 0,
        },
      });

      cancel();
    });
  });

  describe('cache.batch', () => {
    const last = <E>(array: E[]) => array[array.length - 1];

    function watch(cache: Hermes, query: DocumentNode) {
      const options: Cache.WatchOptions = {
        query,
        optimistic: true,
        immediate: true,
        callback(diff) {
          diffs.push(diff);
        },
      };
      const diffs: Cache.DiffResult<any>[] = [];
      const cancel = cache.watch(options);
      diffs.shift(); // Discard the immediate diff
      return { diffs, watch: options, cancel };
    }

    it('calls onWatchUpdated for each invalidated watch', () => {
      const cache = new Hermes();

      const aQuery = gql`
        query {
          a
        }
      `;
      const abQuery = gql`
        query {
          a
          b
        }
      `;
      const bQuery = gql`
        query {
          b
        }
      `;

      const aInfo = watch(cache, aQuery);
      const abInfo = watch(cache, abQuery);
      const bInfo = watch(cache, bQuery);

      const dirtied = new Map<Cache.WatchOptions, Cache.DiffResult<any>>();

      const aUpdateResult = cache.batch({
        update(c) {
          c.writeQuery({
            query: aQuery,
            data: {
              a: 'ay',
            },
          });
          return 'aQuery updated';
        },
        optimistic: true,
        onWatchUpdated(w, diff) {
          dirtied.set(w, diff);
        },
      });
      expect(aUpdateResult).toBe('aQuery updated');

      expect(dirtied.size).toBe(2);
      expect(dirtied.has(aInfo.watch)).toBe(true);
      expect(dirtied.has(abInfo.watch)).toBe(true);
      expect(dirtied.has(bInfo.watch)).toBe(false);

      expect(aInfo.diffs.length).toBe(1);
      expect(last(aInfo.diffs)).toMatchObject({
        complete: true,
        result: {
          a: 'ay',
        },
      });

      expect(abInfo.diffs.length).toBe(1);
      expect(last(abInfo.diffs)).toMatchObject({
        complete: false,
        result: {
          a: 'ay',
        },
      });

      expect(bInfo.diffs.length).toBe(0);

      dirtied.clear();

      const bUpdateResult = cache.batch({
        update(c) {
          c.writeQuery({
            query: bQuery,
            data: {
              b: 'bee',
            },
          });
          // Not returning anything, so beUpdateResult will be undefined.
        },
        optimistic: true,
        onWatchUpdated(w, diff) {
          dirtied.set(w, diff);
        },
      });
      expect(bUpdateResult).toBeUndefined();

      expect(dirtied.size).toBe(2);
      expect(dirtied.has(aInfo.watch)).toBe(false);
      expect(dirtied.has(abInfo.watch)).toBe(true);
      expect(dirtied.has(bInfo.watch)).toBe(true);

      expect(aInfo.diffs.length).toBe(1);
      expect(last(aInfo.diffs)).toMatchObject({
        complete: true,
        result: {
          a: 'ay',
        },
      });

      expect(abInfo.diffs.length).toBe(2);
      expect(last(abInfo.diffs)).toMatchObject({
        complete: true,
        result: {
          a: 'ay',
          b: 'bee',
        },
      });

      expect(bInfo.diffs.length).toBe(1);
      expect(last(bInfo.diffs)).toMatchObject({
        complete: true,
        result: {
          b: 'bee',
        },
      });

      aInfo.cancel();
      abInfo.cancel();
      bInfo.cancel();
    });

    it('works with cache.modify and INVALIDATE', () => {
      const cache = new Hermes();

      const aQuery = gql`
        query {
          a
        }
      `;
      const abQuery = gql`
        query {
          a
          b
        }
      `;
      const bQuery = gql`
        query {
          b
        }
      `;

      cache.writeQuery({
        query: abQuery,
        data: {
          a: 'ay',
          b: 'bee',
        },
      });

      const aInfo = watch(cache, aQuery);
      const abInfo = watch(cache, abQuery);
      const bInfo = watch(cache, bQuery);

      const dirtied = new Map<Cache.WatchOptions, Cache.DiffResult<any>>();

      cache.batch({
        update(c) {
          c.modify({
            fields: {
              a(value, { INVALIDATE }) {
                expect(value).toBe('ay');
                return INVALIDATE;
              },
            },
          });
        },
        optimistic: true,
        onWatchUpdated(w, diff) {
          dirtied.set(w, diff);
        },
      });

      expect(dirtied.size).toBe(2);
      expect(dirtied.has(aInfo.watch)).toBe(true);
      expect(dirtied.has(abInfo.watch)).toBe(true);
      expect(dirtied.has(bInfo.watch)).toBe(false);

      // No new diffs should have been generated, since we only invalidated
      // fields using cache.modify, and did not change any field values.
      expect(aInfo.diffs).toEqual([]);
      expect(abInfo.diffs).toEqual([]);
      expect(bInfo.diffs).toEqual([]);

      aInfo.cancel();
      abInfo.cancel();
      bInfo.cancel();
    });

    it('does not pass previously invalidated queries to onWatchUpdated', () => {
      const cache = new Hermes();

      const aQuery = gql`
        query {
          a
        }
      `;
      const abQuery = gql`
        query {
          a
          b
        }
      `;
      const bQuery = gql`
        query {
          b
        }
      `;

      cache.writeQuery({
        query: abQuery,
        data: {
          a: 'ay',
          b: 'bee',
        },
      });

      const aInfo = watch(cache, aQuery);
      const abInfo = watch(cache, abQuery);
      const bInfo = watch(cache, bQuery);

      cache.writeQuery({
        query: bQuery,
        // Writing this data with broadcast:false queues this update for
        // the next broadcast, whenever it happens. If that next broadcast
        // is the one triggered by cache.batch, the bQuery broadcast could
        // be accidentally intercepted by onWatchUpdated, even though the
        // transaction does not touch the Query.b field. To solve this
        // problem, the batch method calls cache.broadcastWatches() before
        // the transaction, when options.onWatchUpdated is provided.
        broadcast: false,
        data: {
          b: 'beeeee',
        },
      });

      // No diffs reported so far, thanks to broadcast: false.
      expect(aInfo.diffs).toEqual([]);
      expect(abInfo.diffs).toEqual([]);
      expect(bInfo.diffs).toEqual([]);

      const dirtied = new Map<Cache.WatchOptions, Cache.DiffResult<any>>();

      cache.batch({
        update(c) {
          c.modify({
            fields: {
              a(value) {
                expect(value).toBe('ay');
                return 'ayyyy';
              },
            },
          });
        },
        optimistic: true,
        onWatchUpdated(w, diff) {
          dirtied.set(w, diff);
        },
      });

      expect(dirtied.size).toBe(2);
      expect(dirtied.has(aInfo.watch)).toBe(true);
      expect(dirtied.has(abInfo.watch)).toBe(true);
      expect(dirtied.has(bInfo.watch)).toBe(false);

      expect(aInfo.diffs).toMatchObject([
        // This diff resulted from the cache.modify call in the cache.batch
        // update function.
        {
          complete: true,
          result: {
            a: 'ayyyy',
          },
        },
      ]);

      expect(abInfo.diffs).toMatchObject([
        // This diff resulted from the cache.modify call in the cache.batch
        // update function.
        {
          complete: true,
          result: {
            a: 'ayyyy',
            b: 'beeeee',
          },
        },
      ]);

      // No diffs so far for bQuery.
      expect(bInfo.diffs).toEqual([]);

      // Trigger broadcast of watchers that were dirty before the cache.batch
      // transaction.
      cache['broadcastWatches']();

      expect(aInfo.diffs).toMatchObject([
        // Same array of diffs as before.
        {
          complete: true,
          result: {
            a: 'ayyyy',
          },
        },
      ]);

      expect(abInfo.diffs).toMatchObject([
        // The abQuery watcher was dirty before the cache.batch transaction,
        // but it got picked up in the post-transaction broadcast, which is why
        // we do not see another (duplicate) diff here.
        {
          complete: true,
          result: {
            a: 'ayyyy',
            b: 'beeeee',
          },
        },
      ]);

      expect(bInfo.diffs).toMatchObject([
        // This diff is caused by the data written by cache.writeQuery before
        // the cache.batch transaction, but gets broadcast only after the batch
        // transaction, by cache["broadcastWatches"]() above.
        {
          complete: true,
          result: {
            b: 'beeeee',
          },
        },
      ]);

      aInfo.cancel();
      abInfo.cancel();
      bInfo.cancel();
    });

    it('returns options.update result for optimistic and non-optimistic batches', () => {
      const cache = new Hermes();
      const expected = Symbol.for('expected');

      expect(
        cache.batch({
          optimistic: false,
          update(c) {
            c.writeQuery({
              query: gql`
                query {
                  value
                }
              `,
              data: { value: 12345 },
            });
            return expected;
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          optimistic: false,
          update(c) {
            c.reset();
            return expected;
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          optimistic: false,
          update(c) {
            c.writeQuery({
              query: gql`
                query {
                  optimistic
                }
              `,
              data: { optimistic: false },
            });
            return expected;
          },
          onWatchUpdated() {
            throw new Error('onWatchUpdated should not have been called');
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          optimistic: true,
          update(_c) {
            return expected;
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          optimistic: true,
          update(c) {
            c.writeQuery({
              query: gql`
                query {
                  optimistic
                }
              `,
              data: { optimistic: true },
            });
            return expected;
          },
          onWatchUpdated() {
            throw new Error('onWatchUpdated should not have been called');
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          // The optimistic option defaults to true.
          // optimistic: true,
          update(_c) {
            return expected;
          },
        })
      ).toBe(expected);

      expect(
        cache.batch({
          optimistic: 'some optimistic ID',
          update(c) {
            expect(
              c.readQuery({
                query: gql`
                  query {
                    __typename
                  }
                `,
              })
            ).toMatchObject({ __typename: 'Query' });
            return expected;
          },
        })
      ).toBe(expected);

      const optimisticId = 'some optimistic ID';
      expect(
        cache.batch({
          optimistic: optimisticId,
          update(c) {
            c.writeQuery({
              query: gql`
                query {
                  optimistic
                }
              `,
              data: { optimistic: optimisticId },
            });
            return expected;
          },
          onWatchUpdated() {
            throw new Error('onWatchUpdated should not have been called');
          },
        })
      ).toBe(expected);
    });
  });

  describe('performTransaction', () => {
    itWithInitialData('will not broadcast mid-transaction', [{}], (cache) => {
      let numBroadcasts = 0;

      const query = gql`
        {
          a
        }
      `;

      cache.watch({
        query,
        optimistic: false,
        callback: () => {
          numBroadcasts++;
        },
      });

      expect(numBroadcasts).toEqual(0);

      cache.performTransaction((proxy) => {
        proxy.writeQuery({
          data: { a: 1 },
          query,
        });

        expect(numBroadcasts).toEqual(0);

        proxy.writeQuery({
          data: { a: 4, b: 5, c: 6 },
          query: gql`
            {
              a
              b
              c
            }
          `,
        });

        expect(numBroadcasts).toEqual(0);
      });

      expect(numBroadcasts).toEqual(1);
    });
  });

  describe('recordOptimisticTransaction', () => {
    itWithInitialData('will only broadcast once', [{}], (cache) => {
      let numBroadcasts = 0;

      const query = gql`
        {
          a
        }
      `;

      cache.watch({
        query,
        optimistic: true,
        callback: () => {
          numBroadcasts++;
        },
      });

      expect(numBroadcasts).toEqual(0);

      cache.recordOptimisticTransaction((proxy) => {
        proxy.writeQuery({
          data: { a: 1 },
          query,
        });

        expect(numBroadcasts).toEqual(0);

        proxy.writeQuery({
          data: { a: 4, b: 5, c: 6 },
          query: gql`
            {
              a
              b
              c
            }
          `,
        });

        expect(numBroadcasts).toEqual(0);
      }, 1 as any);

      expect(numBroadcasts).toEqual(1);
    });
  });
});

describe('Hermes#broadcastWatches', () => {
  it('should keep distinct consumers distinct (issue #5733)', () => {
    const cache = new Hermes();
    const query = gql`
      query {
        value(arg: $arg) {
          name
        }
      }
    `;

    const receivedCallbackResults: [string, number, any][] = [];

    let nextWatchId = 1;
    function watch(arg: number) {
      const watchId = `id${nextWatchId++}`;
      cache.watch({
        query,
        variables: { arg },
        optimistic: false,
        callback(result) {
          receivedCallbackResults.push([watchId, arg, result]);
        },
      });
      return watchId;
    }

    const id1 = watch(1);
    expect(receivedCallbackResults).toEqual([]);

    function write(arg: number, name: string) {
      cache.writeQuery({
        query,
        variables: { arg },
        data: {
          value: { name },
        },
      });
    }

    write(1, 'one');

    const received1 = [
      id1,
      1,
      {
        result: {
          value: {
            name: 'one',
          },
        },
        complete: true,
      },
    ];

    expect(receivedCallbackResults).toMatchObject([received1]);

    const id2 = watch(2);

    expect(receivedCallbackResults).toMatchObject([received1]);

    write(2, 'two');

    const received2 = [
      id2,
      2,
      {
        result: {
          value: {
            name: 'two',
          },
        },
        complete: true,
      },
    ];

    expect(receivedCallbackResults).toMatchObject([
      received1,
      // New results:
      received2,
    ]);

    const id3 = watch(1);
    const id4 = watch(1);

    write(1, 'one');

    const received3 = [
      id3,
      1,
      {
        result: {
          value: {
            name: 'one',
          },
        },
        complete: true,
      },
    ];

    const received4 = [
      id4,
      1,
      {
        result: {
          value: {
            name: 'one',
          },
        },
        complete: true,
      },
    ];

    expect(receivedCallbackResults).toMatchObject([
      received1,
      received2,
      // New results:
      received3,
      received4,
    ]);

    write(2, 'TWO');

    const received2AllCaps = [
      id2,
      2,
      {
        result: {
          value: {
            name: 'TWO',
          },
        },
        complete: true,
      },
    ];

    expect(receivedCallbackResults).toMatchObject([
      received1,
      received2,
      received3,
      received4,
      // New results:
      received2AllCaps,
    ]);
  });

  it('should pass WatchOptions through to cache.diff', () => {
    const typePolicies: TypePolicies = {
      Query: {
        fields: {
          object(_, { variables }) {
            return { name: variables?.name ?? 'UNKNOWN' };
          },
        },
      },
    };

    const canonicalCache = new Hermes({
      typePolicies,
    });

    const nonCanonicalCache = new Hermes({
      typePolicies,
    });

    const query = gql`
      query {
        object {
          name
        }
      }
    `;

    const unwatchers = new Set<() => void>();

    type Diff = Cache.DiffResult<{
      object: {
        name: string,
      },
    }>;
    const diffs: Record<string, Diff[]> = Object.create(null);
    function addDiff(name: string, diff: Diff) {
      (diffs[name] || (diffs[name] = [])).push(diff);
    }

    const commonWatchOptions = {
      query,
      optimistic: true,
      immediate: true,
      callback(diff: Diff) {
        addDiff(diff.result!.object.name, diff);
      },
    };

    unwatchers.add(
      canonicalCache.watch({
        ...commonWatchOptions,
        variables: { name: 'canonicalByDefault' },
        // Pass nothing for canonizeResults to let the default for
        // canonicalCache (true) prevail.
      })
    );

    unwatchers.add(
      nonCanonicalCache.watch({
        ...commonWatchOptions,
        variables: { name: 'nonCanonicalByDefault' },
        // Pass nothing for canonizeResults to let the default for
        // nonCanonicalCache (false) prevail.
      })
    );

    unwatchers.add(
      nonCanonicalCache.watch({
        ...commonWatchOptions,
        variables: { name: 'canonicalByChoice' },
        canonizeResults: true, // Override the default.
      })
    );

    unwatchers.add(
      canonicalCache.watch({
        ...commonWatchOptions,
        variables: { name: 'nonCanonicalByChoice' },
        canonizeResults: false, // Override the default.
      })
    );

    function makeDiff(name: string): Diff {
      return {
        complete: true,
        result: {
          object: { name },
        },
      };
    }

    const canonicalByDefaultDiff = makeDiff('canonicalByDefault');
    const nonCanonicalByDefaultDiff = makeDiff('nonCanonicalByDefault');
    const canonicalByChoiceDiff = makeDiff('canonicalByChoice');
    const nonCanonicalByChoiceDiff = makeDiff('nonCanonicalByChoice');

    expect(diffs).toMatchObject({
      canonicalByDefault: [canonicalByDefaultDiff],
      nonCanonicalByDefault: [nonCanonicalByDefaultDiff],
      canonicalByChoice: [canonicalByChoiceDiff],
      nonCanonicalByChoice: [nonCanonicalByChoiceDiff],
    });

    [canonicalCache, nonCanonicalCache].forEach((cache) => {
      // Hack: delete every watch.lastDiff, so subsequent results will be
      // broadcast, even though they are deeply equal to the previous results.
      // @ts-ignore
      cache['watches'].forEach((watch) => {
        delete watch.lastDiff;
      });
    });

    // Evict Query.object to invalidate the result cache.
    canonicalCache.evict({
      fieldName: 'object',
    });
    nonCanonicalCache.evict({
      fieldName: 'object',
    });

    // Every watcher receives the same (deeply equal) Diff a second time.
    expect(diffs).toMatchObject({
      canonicalByDefault: [canonicalByDefaultDiff, canonicalByDefaultDiff],
      nonCanonicalByDefault: [
        nonCanonicalByDefaultDiff,
        nonCanonicalByDefaultDiff,
      ],
      canonicalByChoice: [canonicalByChoiceDiff, canonicalByChoiceDiff],
      nonCanonicalByChoice: [
        nonCanonicalByChoiceDiff,
        nonCanonicalByChoiceDiff,
      ],
    });

    function expectCanonical(name: string) {
      const count = diffs[name].length;
      const firstDiff = diffs[name][0];
      for (let i = 1; i < count; ++i) {
        expect(firstDiff).toEqual(diffs[name][i]);
        expect(firstDiff.result).toBe(diffs[name][i].result);
      }
    }
    /*
    function expectNonCanonical(name: string) {
      const count = diffs[name].length;
      const firstDiff = diffs[name][0];
      for (let i = 1; i < count; ++i) {
        expect(firstDiff).toEqual(diffs[name][i]);
        expect(firstDiff.result).not.toBe(diffs[name][i].result);
      }
    }
    */

    // However, some of the diff.result objects are canonized and thus ===, and
    // others are deeply equal but not canonized (and thus not ===).
    expectCanonical('canonicalByDefault');
    expectCanonical('canonicalByChoice');
    // expectNonCanonical('nonCanonicalByDefault'); TODO
    // expectNonCanonical('nonCanonicalByChoice');

    unwatchers.forEach(unwatch => unwatch());
  });
});

describe('Hermes#modify', () => {
  it('should work with single modifier function', () => {
    const cache = new Hermes();
    const query = gql`
      query {
        a
        b
        c
      }
    `;

    cache.writeQuery({
      query,
      data: {
        a: 0,
        b: 0,
        c: 0,
      },
    });

    const resultBeforeModify = cache.readQuery({ query });
    expect(resultBeforeModify).toMatchObject({ a: 0, b: 0, c: 0 });

    cache.modify({
      // Passing a function for options.fields is equivalent to invoking
      // that function for all fields within the object.
      fields(value, { fieldName }) {
        switch (fieldName) {
          case 'a':
            return value + 1;
          case 'b':
            return value - 1;
          default:
            return value;
        }
      },
    });

    expect(cache.extract()).toMatchObject({
      ROOT_QUERY: {
        data: {
          a: 1,
          b: -1,
          c: 0,
        },
      },
    });

    const resultAfterModify = cache.readQuery({ query });
    expect(resultAfterModify).toMatchObject({ a: 1, b: -1, c: 0 });
  });

  it('should work with multiple modifier functions', () => {
    const cache = new Hermes();
    const query = gql`
      query {
        a
        b
        c
      }
    `;

    cache.writeQuery({
      query,
      data: {
        a: 0,
        b: 0,
        c: 0,
      },
    });

    const resultBeforeModify = cache.readQuery({ query });
    expect(resultBeforeModify).toMatchObject({ a: 0, b: 0, c: 0 });

    let checkedTypename = false;
    cache.modify({
      fields: {
        a(value) {
          return value + 1;
        },
        b(value) {
          return value - 1;
        },
        __typename(t: string, { readField }) {
          expect(t).toBe('Query');
          expect(readField('c')).toBe(0);
          checkedTypename = true;
          return t;
        },
      },
    });
    expect(checkedTypename).toBe(true);

    expect(cache.extract()).toMatchObject({
      ROOT_QUERY: {
        data: {
          a: 1,
          b: -1,
          c: 0,
        },
      },
    });

    const resultAfterModify = cache.readQuery({ query });
    expect(resultAfterModify).toMatchObject({ a: 1, b: -1, c: 0 });
  });

  it('should allow invalidation using details.INVALIDATE', () => {
    const cache = new Hermes({
      typePolicies: {
        Book: {
          keyFields: ['isbn'],
        },
        Author: {
          keyFields: ['name'],
        },
      },
    });

    const query: TypedDocumentNode<{
      currentlyReading: {
        title: string,
        isbn: string,
        author: {
          name: string,
        },
      },
    }> = gql`
      query {
        currentlyReading {
          title
          isbn
          author {
            name
          }
        }
      }
    `;

    const currentlyReading = {
      __typename: 'Book',
      isbn: '0374110034',
      title: 'Beowulf: A New Translation',
      author: {
        __typename: 'Author',
        name: 'Maria Dahvana Headley',
      },
    };

    cache.writeQuery({
      query,
      data: {
        currentlyReading,
      },
    });

    function read() {
      return cache.readQuery({ query })!;
    }

    const initialResult = read();

    expect(cache.extract()).toMatchSnapshot();

    expect(
      cache.modify({
        id: cache.identify({
          __typename: 'Author',
          name: 'Maria Dahvana Headley',
        }),
        fields: {
          name(_, { INVALIDATE }) {
            return INVALIDATE;
          },
        },
      })
    ).toBe(false); // Nothing actually modified.

    const resultAfterAuthorInvalidation = read();
    expect(resultAfterAuthorInvalidation).toEqual(initialResult);
    // expect(resultAfterAuthorInvalidation).toBe(initialResult); TODO

    expect(
      cache.modify({
        id: cache.identify({
          __typename: 'Book',
          isbn: '0374110034',
        }),
        // Invalidate all fields of the Book entity.
        fields(_, { INVALIDATE }) {
          return INVALIDATE;
        },
      })
    ).toBe(false); // Nothing actually modified.

    const resultAfterBookInvalidation = read();
    expect(resultAfterBookInvalidation).toEqual(resultAfterAuthorInvalidation);
    // TODO
    // expect(resultAfterBookInvalidation).toBe(resultAfterAuthorInvalidation);
    expect(resultAfterBookInvalidation.currentlyReading.author).toEqual({
      __typename: 'Author',
      name: 'Maria Dahvana Headley',
    });
    /* TODO
    expect(resultAfterBookInvalidation.currentlyReading.author).toBe(
      resultAfterAuthorInvalidation.currentlyReading.author
    );
    */
  });

  it('should allow deletion using details.DELETE', () => {
    const cache = new Hermes({
      typePolicies: {
        Book: {
          keyFields: ['isbn'],
        },
        Author: {
          keyFields: ['name'],
        },
      },
    });

    const query = gql`
      query {
        currentlyReading {
          title
          isbn
          author {
            name
            yearOfBirth
          }
        }
      }
    `;

    const currentlyReading = {
      __typename: 'Book',
      isbn: '147670032X',
      title: 'Why We\'re Polarized',
      author: {
        __typename: 'Author',
        name: 'Ezra Klein',
        yearOfBirth: 1983,
      },
    };

    cache.writeQuery({
      query,
      data: {
        currentlyReading,
      },
    });

    expect(cache.extract()).toEqual({
      'Author:{"name":"Ezra Klein"}': {
        'data': {
          '__typename': 'Author',
          'name': 'Ezra Klein',
          'yearOfBirth': 1983,
        },
        'inbound': [
          {
            'id': 'Book:{"isbn":"147670032X"}',
            'path': [
              'author',
            ],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"147670032X"}': {
        'data': {
          '__typename': 'Book',
          'author': undefined,
          'isbn': '147670032X',
          'title': 'Why We\'re Polarized',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'currentlyReading',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Author:{"name":"Ezra Klein"}',
            'path': [
              'author',
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'currentlyReading': undefined,
        },
        'outbound': [
          {
            'id': 'Book:{"isbn":"147670032X"}',
            'path': [
              'currentlyReading',
            ],
          },
        ],
        'type': 0,
      },
    });

    const authorId = cache.identify(currentlyReading.author)!;
    expect(authorId).toBe('Author:{"name":"Ezra Klein"}');

    cache.modify({
      id: authorId,
      fields: {
        yearOfBirth(yob) {
          return yob + 1;
        },
      },
    });

    const yobResult = cache.readFragment({
      id: authorId,
      fragment: gql`
        fragment YOB on Author {
          yearOfBirth
        }
      `,
    });

    expect(yobResult).toMatchObject({
      __typename: 'Author',
      yearOfBirth: 1984,
    });

    const bookId = cache.identify(currentlyReading)!;

    // Modifying the Book in order to modify the Author is fancier than
    // necessary, but we want fancy use cases to work, too.
    cache.modify({
      id: bookId,
      fields: {
        author(author: Reference, { readField }) {
          expect(readField('title')).toBe('Why We\'re Polarized');
          expect(readField('name', author)).toBe('Ezra Klein');
          cache.modify({
            fields: {
              yearOfBirth(yob, { DELETE }) {
                expect(yob).toBe(1984);
                return DELETE;
              },
            },
            id: cache.identify({
              __typename: readField('__typename', author),
              name: readField('name', author),
            }),
          });
          return author;
        },
      },
    });

    const snapshotWithoutYOB = cache.extract();
    expect(snapshotWithoutYOB[authorId]!.yearOfBirth).toBeUndefined();
    expect('yearOfBirth' in snapshotWithoutYOB[authorId]!).toBe(false);
    expect(snapshotWithoutYOB).toEqual({
      'Author:{"name":"Ezra Klein"}': {
        'data': {
          '__typename': 'Author',
          'name': 'Ezra Klein',
        },
        'inbound': [
          {
            'id': 'Book:{"isbn":"147670032X"}',
            'path': [
              'author',
            ],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"147670032X"}': {
        'data': {
          '__typename': 'Book',
          'author': undefined,
          'isbn': '147670032X',
          'title': 'Why We\'re Polarized',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'currentlyReading',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Author:{"name":"Ezra Klein"}',
            'path': [
              'author',
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'currentlyReading': undefined,
        },
        'outbound': [
          {
            'id': 'Book:{"isbn":"147670032X"}',
            'path': [
              'currentlyReading',
            ],
          },
        ],
        'type': 0,
      },
    });

    // Delete the whole Book.
    cache.modify({
      id: bookId,
      fields: (_, { DELETE }) => DELETE,
    });

    const snapshotWithoutBook = cache.extract();
    expect(snapshotWithoutBook[bookId]).toBeUndefined();
    expect(bookId in snapshotWithoutBook).toBe(false);
    expect(snapshotWithoutBook).toEqual({
      'Author:{"name":"Ezra Klein"}': {
        data: {
          __typename: 'Author',
          name: 'Ezra Klein',
        },
        type: 0,
      },
      ROOT_QUERY: {
        data: {
          currentlyReading: null,
        },
        type: 0,
      },
    });

    // Delete all fields of the Author, which also removes the object.
    cache.modify({
      id: authorId,
      fields: {
        __typename(_, { DELETE }) {
          return DELETE;
        },
        name(_, { DELETE }) {
          return DELETE;
        },
      },
    });

    const snapshotWithoutAuthor = cache.extract();
    expect(snapshotWithoutAuthor[authorId]).toBeUndefined();
    expect(authorId in snapshotWithoutAuthor).toBe(false);
    expect(snapshotWithoutAuthor).toEqual({
      ROOT_QUERY: {
        data: {
          currentlyReading: null,
        },
        type: 0,
      },
    });

    cache.modify({
      fields: (_, { DELETE }) => DELETE,
    });

    expect(cache.extract()).toEqual({});
  });

  it('can remove specific items from paginated lists', () => {
    const cache = new Hermes({
      typePolicies: {
        Thread: {
          keyFields: ['tid'],

          fields: {
            comments: {
              merge(
                existing: Reference[],
                incoming: Reference[],
                { args, mergeObjects }
              ) {
                const merged = existing ? existing.slice(0) : [];
                const end
                  = args!.offset + Math.min(args!.limit, incoming.length);
                for (let i = args!.offset; i < end; ++i) {
                  merged[i] = mergeObjects(
                    merged[i],
                    incoming[i - args!.offset]
                  ) as Reference;
                }
                return merged;
              },

              read(existing: Reference[], { args }) {
                const page
                  = existing &&
                  existing.slice(args!.offset, args!.offset + args!.limit);
                if (page && page.length > 0) {
                  return page;
                }
                return undefined;
              },
            },
          },
        },

        Comment: {
          keyFields: ['id'],
        },
      },
    });

    const query = gql`
      query GetThread($offset: Int, $limit: Int) {
        thread {
          tid
          comments(offset: $offset, limit: $limit) {
            id
            text
          }
        }
      }
    `;

    cache.writeQuery({
      query,
      data: {
        thread: {
          __typename: 'Thread',
          tid: 123,
          comments: [
            {
              __typename: 'Comment',
              id: 'c1',
              text: 'first post',
            },
            {
              __typename: 'Comment',
              id: 'c2',
              text: 'I have thoughts',
            },
            {
              __typename: 'Comment',
              id: 'c3',
              text: 'friendly ping',
            },
          ],
        },
      },
      variables: {
        offset: 0,
        limit: 3,
      },
    });

    expect(cache.extract()).toEqual({
      'Comment:{"id":"c1"}': {
        'data': {
          '__typename': 'Comment',
          'id': 'c1',
          'text': 'first post',
        },
        'inbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Comment:{"id":"c2"}': {
        'data': {
          '__typename': 'Comment',
          'id': 'c2',
          'text': 'I have thoughts',
        },
        'inbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              1,
            ],
          },
        ],
        'type': 0,
      },
      'Comment:{"id":"c3"}': {
        'data': {
          '__typename': 'Comment',
          'id': 'c3',
          'text': 'friendly ping',
        },
        'inbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              2,
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'thread': undefined,
        },
        'outbound': [
          {
            'id': 'Thread:{"tid":123}',
            'path': [
              'thread',
            ],
          },
        ],
        'type': 0,
      },
      'Thread:{"tid":123}': {
        'data': {
          '__typename': 'Thread',
          'tid': 123,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'thread',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              'comments',
            ],
          },
        ],
        'type': 0,
      },
      'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}': {
        'data': [
          undefined,
          undefined,
          undefined,
        ],
        'inbound': [
          {
            'id': 'Thread:{"tid":123}',
            'path': [
              'comments',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Comment:{"id":"c1"}',
            'path': [
              0,
            ],
          },
          {
            'id': 'Comment:{"id":"c2"}',
            'path': [
              1,
            ],
          },
          {
            'id': 'Comment:{"id":"c3"}',
            'path': [
              2,
            ],
          },
        ],
        'type': 1,
      },
    });

    cache.modify({
      fields: {
        comments(comments: readonly Reference[], { readField }) {
          // expect(Object.isFrozen(comments)).toBe(true);
          expect(comments.length).toBe(3);
          const filtered = comments.filter((comment) => {
            return readField('id', comment) !== 'c1';
          });
          expect(filtered.length).toBe(2);
          return filtered;
        },
      },

      id: cache.identify({
        __typename: 'Thread',
        tid: 123,
      }),
    });

    expect(cache.gc()).toEqual(['Comment:{"id":"c1"}']);

    expect(cache.extract()).toEqual({
      'Comment:{"id":"c2"}': {
        'data': {
          '__typename': 'Comment',
          'id': 'c2',
          'text': 'I have thoughts',
        },
        'inbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Comment:{"id":"c3"}': {
        'data': {
          '__typename': 'Comment',
          'id': 'c3',
          'text': 'friendly ping',
        },
        'inbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              1,
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': { 'thread': undefined },
        'outbound': [
          {
            'id': 'Thread:{"tid":123}',
            'path': [
              'thread',
            ],
          },
        ],
        'type': 0,
      },
      'Thread:{"tid":123}': {
        'data': {
          '__typename': 'Thread',
          'tid': 123,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'thread',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}',
            'path': [
              'comments',
            ],
          },
        ],
        'type': 0,
      },
      'Thread:{"tid":123}❖["comments"]❖{"offset":0,"limit":3}': {
        'data': [
          undefined,
          undefined,
        ],
        'inbound': [
          {
            'id': 'Thread:{"tid":123}',
            'path': [
              'comments',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Comment:{"id":"c2"}',
            'path': [
              0,
            ],
          },
          {
            'id': 'Comment:{"id":"c3"}',
            'path': [
              1,
            ],
          },
        ],
        'type': 1,
      },
    });
  });

  it('should not revisit deleted fields', () => {
    const cache = new Hermes();
    const query = gql`
      query {
        a
        b
        c
      }
    `;

    cache.recordOptimisticTransaction((c) => {
      c.writeQuery({
        query,
        data: {
          a: 1,
          b: 2,
          c: 3,
        },
      });
    }, 'transaction');

    cache.modify({
      fields: {
        b(value, { DELETE }) {
          expect(value).toBe(2);
          return DELETE;
        },
      },
      optimistic: true,
    });

    expect(cache.extract(true)).toEqual({
      ROOT_QUERY: {
        data: {
          a: 1,
          c: 3,
        },
        type: 0,
      },
    });

    cache.modify({
      fields(value, { fieldName }) {
        expect(fieldName).not.toBe('b');
        if (fieldName === 'a') expect(value).toBe(1);
        if (fieldName === 'c') expect(value).toBe(3);
        return value;
      },
      optimistic: true,
    });

    cache.removeOptimistic('transaction');

    expect(cache.extract(true)).toEqual({});
  });

  it('should broadcast watches for queries with changed fields', () => {
    const cache = new Hermes();
    const queryA = gql`
      {
        a {
          value
        }
      }
    `;
    const queryB = gql`
      {
        b {
          value
        }
      }
    `;

    cache.writeQuery({
      query: queryA,
      data: {
        a: {
          __typename: 'A',
          id: 1,
          value: 123,
        },
      },
    });

    cache.writeQuery({
      query: queryB,
      data: {
        b: {
          __typename: 'B',
          id: 1,
          value: 321,
        },
      },
    });

    expect(cache.extract()).toEqual({
      'A:1': {
        'data': {
          '__typename': 'A',
          'id': 1,
          'value': 123,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'a',
            ],
          },
        ],
        'type': 0,
      },
      'B:1': {
        'data': {
          '__typename': 'B',
          'id': 1,
          'value': 321,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'b',
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {},
        'outbound': [
          {
            'id': 'A:1',
            'path': [
              'a',
            ],
          },
          {
            'id': 'B:1',
            'path': [
              'b',
            ],
          },
        ],
        'type': 0,
      },
    });

    const aResults: any[] = [];
    cache.watch({
      query: queryA,
      optimistic: true,
      immediate: true,
      callback(data) {
        aResults.push(data);
      },
    });

    const bResults: any[] = [];
    cache.watch({
      query: queryB,
      optimistic: true,
      immediate: true,
      callback(data) {
        bResults.push(data);
      },
    });

    function makeResult(
      __typename: string,
      value: number,
      complete: boolean = true
    ) {
      return {
        complete,
        result: {
          [__typename.toLowerCase()]: {
            __typename,
            value,
          },
        },
      };
    }

    const a123 = makeResult('A', 123);
    const b321 = makeResult('B', 321);

    expect(aResults).toMatchObject([a123]);
    expect(bResults).toMatchObject([b321]);

    const aId = cache.identify({ __typename: 'A', id: 1 });
    const bId = cache.identify({ __typename: 'B', id: 1 });

    cache.modify({
      id: aId,
      fields: {
        value(x: number) {
          return x + 1;
        },
      },
    });

    const a124 = makeResult('A', 124);

    expect(aResults).toMatchObject([a123, a124]);
    expect(bResults).toMatchObject([b321]);

    cache.modify({
      id: bId,
      fields: {
        value(x: number) {
          return x + 1;
        },
      },
    });

    const b322 = makeResult('B', 322);

    expect(aResults).toMatchObject([a123, a124]);
    expect(bResults).toMatchObject([b321, b322]);

    // Check that resetting the result cache does not trigger additional watch
    // notifications.
    expect(
      cache.gc()
    ).toEqual([]);
    expect(aResults).toMatchObject([a123, a124]);
    expect(bResults).toMatchObject([b321, b322]);
    cache['broadcastWatches']();
    expect(aResults).toMatchObject([a123, a124]);
    expect(bResults).toMatchObject([b321, b322]);
  });

  it('should handle argument-determined field identities', () => {
    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            book: {
              keyArgs: ['isbn'],
            },
          },
        },
        Book: {
          keyFields: ['isbn'],
        },
      },
    });

    function addBook(isbn: string, title: string) {
      cache.writeQuery({
        query: gql`
          query {
            book(isbn: $isbn) {
              isbn
              title
            }
          }
        `,
        data: {
          book: {
            __typename: 'Book',
            isbn,
            title,
          },
        },
        variables: {
          isbn,
        },
      });
    }

    addBook('147670032X', 'Why We\'re Polarized');
    addBook('1760641790', 'How To Do Nothing');
    addBook('0735211280', 'Spineless');

    const fullSnapshot = {
      'Book:{"isbn":"0735211280"}':  {
        'data':  {
          '__typename': 'Book',
          'isbn': '0735211280',
          'title': 'Spineless',
        },
        'inbound':  [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"0735211280"}',
            'path':  [],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"147670032X"}':  {
        'data':  {
          '__typename': 'Book',
          'isbn': '147670032X',
          'title': 'Why We\'re Polarized',
        },
        'inbound':  [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"147670032X"}',
            'path':  [],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"1760641790"}':  {
        'data':  {
          '__typename': 'Book',
          'isbn': '1760641790',
          'title': 'How To Do Nothing',
        },
        'inbound':  [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path':  [],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY':  {
        'outbound':  [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"147670032X"}',
            'path':  [
              'book',
            ],
          },
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path':  [
              'book',
            ],
          },
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"0735211280"}',
            'path':  [
              'book',
            ],
          },
        ],
        'type': 0,
      },
    };

    expect(cache.extract()).toMatchObject(fullSnapshot);

    function check(isbnToDelete?: string) {
      let bookCount = 0;

      cache.modify({
        fields: {
          book(
            book: Reference,
            // eslint-disable-next-line no-shadow
            { fieldName, storeFieldName, isReference, readField, DELETE }
          ) {
            expect(fieldName).toBe('book');
            expect(isReference(book)).toBe(true);
            expect(typeof readField('title', book)).toBe('string');
            expect(readField('__typename', book)).toBe('Book');
            expect(
              readField({
                fieldName: '__typename',
                from: book,
              })
            ).toBe('Book');

            const parts = storeFieldName.split('❖');
            expect(parts.shift()).toBe('ROOT_QUERY');
            expect(parts.shift()).toBe('["book"]');
            const keyArgs = JSON.parse(parts.join(':'));
            expect(typeof keyArgs.isbn).toBe('string');
            expect(Object.keys(keyArgs)).toEqual(['isbn']);

            expect(readField('isbn', book)).toBe(keyArgs.isbn);

            if (isbnToDelete === keyArgs.isbn) {
              return DELETE;
            }

            ++bookCount;

            return book;
          },
        },
      });

      return bookCount;
    }

    // No change from repeatedly calling check().
    expect(check()).toBe(3);
    expect(check()).toBe(3);

    expect(check('0735211280')).toBe(2);
    expect(check('147670032X')).toBe(1);

    // No change from re-deleting already-deleted ISBNs.
    expect(check('0735211280')).toBe(1);
    expect(check('147670032X')).toBe(1);

    expect(cache.extract()).toEqual({
      'Book:{"isbn":"0735211280"}': {
        'data': {
          '__typename': 'Book',
          'isbn': '0735211280',
          'title': 'Spineless',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"0735211280"}',
            'path': [],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"147670032X"}': {
        'data': {
          '__typename': 'Book',
          'isbn': '147670032X',
          'title': 'Why We\'re Polarized',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"147670032X"}',
            'path': [],
          },
        ],
        'type': 0,
      },
      'Book:{"isbn":"1760641790"}': {
        'data': {
          '__typename': 'Book',
          'isbn': '1760641790',
          'title': 'How To Do Nothing',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'book': null,
        },
        'outbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path': [
              'book',
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY❖["book"]❖{"isbn":"0735211280"}': {
        'data': null,
        'outbound': [
          {
            'id': 'Book:{"isbn":"0735211280"}',
            'path': [],
          },
        ],
        'type': 1,
      },
      'ROOT_QUERY❖["book"]❖{"isbn":"147670032X"}': {
        'data': null,
        'outbound': [
          {
            'id': 'Book:{"isbn":"147670032X"}',
            'path': [],
          },
        ],
        'type': 1,
      },
      'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}': {
        'data': null,
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'book',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Book:{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 1,
      },
    });

    expect(cache.gc().sort()).toEqual([
      'Book:{"isbn":"0735211280"}',
      'Book:{"isbn":"147670032X"}',
      'ROOT_QUERY❖["book"]❖{"isbn":"0735211280"}',
      'ROOT_QUERY❖["book"]❖{"isbn":"147670032X"}',
    ]);

    expect(cache.extract()).toEqual({
      'Book:{"isbn":"1760641790"}': {
        'data': {
          '__typename': 'Book',
          'isbn': '1760641790',
          'title': 'How To Do Nothing',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'book': null,
        },
        'outbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path': [
              'book',
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}': {
        'data': null,
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'book',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Book:{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 1,
      },
    });

    expect(check('1760641790')).toBe(0);

    expect(cache.extract()).toEqual({
      'Book:{"isbn":"1760641790"}': {
        'data': {
          '__typename': 'Book',
          'isbn': '1760641790',
          'title': 'How To Do Nothing',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'book': null,
        },
        'type': 0,
      },
      'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}': {
        'data': null,
        'outbound': [
          {
            'id': 'Book:{"isbn":"1760641790"}',
            'path': [],
          },
        ],
        'type': 1,
      },
    });

    expect(cache.gc()).toEqual([
      'ROOT_QUERY❖["book"]❖{"isbn":"1760641790"}',
      'Book:{"isbn":"1760641790"}',
    ]);

    expect(cache.extract()).toEqual({
      'ROOT_QUERY': {
        'data': {
          'book': null,
        },
        'type': 0,
      },
    });
  });

  it('should modify ROOT_QUERY only when options.id absent', () => {
    const cache = new Hermes();

    cache.writeQuery({
      query: gql`
        query {
          field
        }
      `,
      data: {
        field: 'oyez',
      },
    });

    const snapshot = {
      ROOT_QUERY: {
        data: {
          field: 'oyez',
        },
      },
    };

    expect(cache.extract()).toMatchObject(snapshot);

    function check(id: any) {
      expect(
        cache.modify({
          id,
          fields(value) {
            throw new Error(`unexpected value: ${value}`);
          },
        })
      ).toBe(false);
    }

    // eslint-disable-next-line no-void
    check(void 0);
    check(false);
    check(null);
    check('');
    check('bogus:id');

    expect(cache.extract()).toMatchObject(snapshot);
  });
});

describe('TypedDocumentNode<Data, Variables>', () => {
  type Book = {
    isbn?: string,
    title: string,
    author: {
      name: string,
    },
  };

  const query: TypedDocumentNode<{ book: Book }, { isbn: string }> = gql`
    query GetBook($isbn: String!) {
      book(isbn: $isbn) {
        title
        author {
          name
        }
      }
    }
  `;

  const fragment: TypedDocumentNode<Book> = gql`
    fragment TitleAndAuthor on Book {
      title
      isbn
      author {
        name
      }
    }
  `;

  // We need to define these objects separately from calling writeQuery,
  // because passing them directly to writeQuery will trigger excess property
  // warnings due to the extra __typename and isbn fields. Internally, we
  // almost never pass object literals to writeQuery or writeFragment, so
  // excess property checks should not be a problem in practice.
  const jcmAuthor = {
    __typename: 'Author',
    name: 'John C. Mitchell',
  };

  const ffplBook = {
    __typename: 'Book',
    isbn: '0262133210',
    title: 'Foundations for Programming Languages',
    author: jcmAuthor,
  };

  const ffplVariables = {
    isbn: '0262133210',
  };

  function getBookCache() {
    return new Hermes({
      typePolicies: {
        Query: {
          fields: {
            book(existing, { args, toReference }) {
              return (
                existing
                ?? (args &&
                  toReference({
                    __typename: 'Book',
                    isbn: args.isbn,
                  }))
              );
            },
          },
        },

        Book: {
          keyFields: ['isbn'],
        },

        Author: {
          keyFields: ['name'],
        },
      },
    });
  }

  it('should determine Data and Variables types of {write,read}{Query,Fragment}', () => {
    const cache = getBookCache();

    cache.writeQuery({
      query,
      variables: ffplVariables,
      data: {
        book: ffplBook,
      },
    });

    expect(cache.extract()).toMatchSnapshot();

    const ffplQueryResult = cache.readQuery({
      query,
      variables: ffplVariables,
    });

    if (ffplQueryResult === null) throw new Error('null result');
    expect(ffplQueryResult.book.author.name).toBe(jcmAuthor.name);
    expect(ffplQueryResult).toMatchObject({
      book: {
        __typename: 'Book',
        title: 'Foundations for Programming Languages',
        author: {
          __typename: 'Author',
          name: 'John C. Mitchell',
        },
      },
    });

    const sicpBook = {
      __typename: 'Book',
      isbn: '0262510871',
      title: 'Structure and Interpretation of Computer Programs',
      author: {
        __typename: 'Author',
        name: 'Harold Abelson',
      },
    };

    const sicpRef = cache.writeFragment({
      fragment,
      data: sicpBook,
    });

    expect(isReference(sicpRef)).toBe(true);
    expect(cache.extract()).toMatchSnapshot();

    const ffplFragmentResult = cache.readFragment({
      fragment,
      id: cache.identify(ffplBook),
    });
    if (ffplFragmentResult === null) throw new Error('null result');
    expect(ffplFragmentResult.title).toBe(ffplBook.title);
    expect(ffplFragmentResult.author.name).toBe(ffplBook.author.name);
    expect(ffplFragmentResult).toEqual(ffplBook);

    // This uses the read function for the Query.book field.
    const sicpReadResult = cache.readQuery({
      query,
      variables: {
        isbn: sicpBook.isbn,
      },
    });
    if (sicpReadResult === null) throw new Error('null result');
    expect(sicpReadResult.book.title).toBe(sicpBook.title);
    expect(sicpReadResult.book.author.name).toBe(sicpBook.author.name);
    expect(sicpReadResult).toMatchObject({
      book: {
        __typename: 'Book',
        title: 'Structure and Interpretation of Computer Programs',
        author: {
          __typename: 'Author',
          name: 'Harold Abelson',
        },
      },
    });
  });

  it.skip('should infer the types of modifier fields', () => {
    const cache = getBookCache();

    cache.writeQuery({
      query,
      variables: ffplVariables,
      data: {
        book: ffplBook,
      },
    });

    cache.modify<Book>({
      id: cache.identify(ffplBook),
      fields: {
        isbn: (value) => {
          expectTypeOf(value).toEqualTypeOf<string>();
          return value;
        },
        title: (value, { INVALIDATE }) => {
          expectTypeOf(value).toEqualTypeOf<string>();
          return INVALIDATE;
        },
        // eslint-disable-next-line no-shadow
        author: (value, { DELETE, isReference }) => {
          expectTypeOf(value).toEqualTypeOf<Reference | Book['author']>();
          if (isReference(value)) {
            expectTypeOf(value).toEqualTypeOf<Reference>();
          } else {
            expectTypeOf(value).toEqualTypeOf<Book['author']>();
          }

          return DELETE;
        },
      },
    });
  });
});
