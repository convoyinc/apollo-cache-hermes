// noinspection GraphQLUnresolvedReference

import gql from 'graphql-tag';
import { Cache, isReference, MissingFieldError, Reference } from '@apollo/client';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { Hermes } from '../../../src';

describe('reading from the store', () => {
  it('readQuery supports returnPartialData', () => {
    const cache = new Hermes();
    const aQuery = gql`
      query {
        a
      }
    `;
    const bQuery = gql`
      query {
        b
      }
    `;
    const abQuery = gql`
      query {
        a
        b
      }
    `;

    cache.writeQuery({
      query: aQuery,
      data: { a: 123 },
    });

    jestExpect(cache.readQuery({ query: bQuery })).toBe(null);
    jestExpect(cache.readQuery({ query: abQuery })).toBe(null);

    jestExpect(
      cache.readQuery({
        query: bQuery,
        returnPartialData: true,
      })
    ).toMatchObject({});

    jestExpect(
      cache.readQuery({
        query: abQuery,
        returnPartialData: true,
      })
    ).toMatchObject({ a: 123 });
  });

  it('readFragment supports returnPartialData', () => {
    const cache = new Hermes();
    const id = cache.identify({
      __typename: 'ABObject',
      id: 321,
    });

    const aFragment = gql`
      fragment AFragment on ABObject {
        a
      }
    `;
    const bFragment = gql`
      fragment BFragment on ABObject {
        b
      }
    `;
    const abFragment = gql`
      fragment ABFragment on ABObject {
        a
        b
      }
    `;

    jestExpect(cache.readFragment({ id, fragment: aFragment })).toBe(null);
    jestExpect(cache.readFragment({ id, fragment: bFragment })).toBe(null);
    jestExpect(cache.readFragment({ id, fragment: abFragment })).toBe(null);

    const ref = cache.writeFragment({
      id,
      fragment: aFragment,
      data: {
        __typename: 'ABObject',
        a: 123,
      },
    });
    jestExpect(isReference(ref)).toBe(true);
    jestExpect(ref!.__ref).toBe(id);

    jestExpect(
      cache.readFragment({
        id,
        fragment: bFragment,
      })
    ).toBe(null);

    jestExpect(
      cache.readFragment({
        id,
        fragment: abFragment,
      })
    ).toBe(null);

    jestExpect(
      cache.readFragment({
        id,
        fragment: bFragment,
        returnPartialData: true,
      })
    ).toMatchObject({
      __typename: 'ABObject',
    });

    jestExpect(
      cache.readFragment({
        id,
        fragment: abFragment,
        returnPartialData: true,
      })
    ).toEqual({
      __typename: 'ABObject',
      a: 123,
    });
  });

  it('distinguishes between missing @client and non-@client fields', () => {
    const query = gql`
      query {
        normal {
          present @client
          missing
        }
        clientOnly @client {
          present
          missing
        }
      }
    `;

    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            normal() {
              return { present: 'here' };
            },
            clientOnly() {
              return { present: 'also here' };
            },
          },
        },
      },
      addTypename: false,
    });

    const { result, complete, missing } = cache.diff({
      query,
      optimistic: true,
      returnPartialData: true,
    });

    jestExpect(complete).toBe(false);

    jestExpect(result).toEqual({
      normal: {
        present: 'here',
      },
      clientOnly: {
        present: 'also here',
      },
    });

    jestExpect(missing?.[0]).toEqual(
      new MissingFieldError(
        `Can't find field 'missing' on object ${JSON.stringify(
          {
            present: 'here',
          },
          null,
          2
        )}`,
        {
          normal: {
            missing: `Can't find field 'missing' on object ${JSON.stringify(
              { present: 'here' },
              null,
              2
            )}`,
          },
          clientOnly: {
            missing: `Can't find field 'missing' on object ${JSON.stringify(
              { present: 'also here' },
              null,
              2
            )}`,
          },
        },
        query,
        {} // variables
      ),
    );
  });

  it('read functions for root query fields work with empty cache', () => {
    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            uuid() {
              return '8d573b9c-cfcf-4e3e-98dd-14d255af577e';
            },
            null() {
              return null;
            },
          },
        },
      },
    });

    jestExpect(
      cache.readQuery({
        query: gql`
          query {
            uuid
            null
          }
        `,
      })
    ).toEqual({
      uuid: '8d573b9c-cfcf-4e3e-98dd-14d255af577e',
      null: null,
    });

    jestExpect(cache.extract()).toEqual({});

    jestExpect(
      cache.readFragment({
        id: 'ROOT_QUERY',
        fragment: gql`
          fragment UUIDFragment on Query {
            null
            uuid
          }
        `,
      })
    ).toEqual({
      '__typename': 'Query',
      uuid: '8d573b9c-cfcf-4e3e-98dd-14d255af577e',
      null: null,
    });

    jestExpect(cache.extract()).toEqual({});

    jestExpect(
      cache.readFragment({
        id: 'does not exist',
        fragment: gql`
          fragment F on Never {
            whatever
          }
        `,
      })
    ).toBe(null);

    jestExpect(cache.extract()).toEqual({});
  });

  it('custom read functions can map/filter dangling references', () => {
    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            ducks(existing: Reference[] = [], { canRead }) {
              return existing.map(duck => (canRead(duck) ? duck : null));
            },
            chickens(existing: Reference[] = [], { canRead }) {
              return existing.map(chicken =>
                (canRead(chicken) ? chicken : {})
              );
            },
            oxen(existing: Reference[] = [], { canRead }) {
              return existing.filter(canRead);
            },
          },
        },
      },
    });

    cache.writeQuery({
      query: gql`
        query {
          ducks {
            quacking
          }
          chickens {
            inCoop
          }
          oxen {
            gee
            haw
          }
        }
      `,
      data: {
        ducks: [
          { __typename: 'Duck', id: 1, quacking: true },
          { __typename: 'Duck', id: 2, quacking: false },
          { __typename: 'Duck', id: 3, quacking: false },
        ],
        chickens: [
          { __typename: 'Chicken', id: 1, inCoop: true },
          { __typename: 'Chicken', id: 2, inCoop: true },
          { __typename: 'Chicken', id: 3, inCoop: false },
        ],
        oxen: [
          { __typename: 'Ox', id: 1, gee: true, haw: false },
          { __typename: 'Ox', id: 2, gee: false, haw: true },
        ],
      },
    });

    jestExpect(cache.extract()).toEqual({
      'Chicken:1': {
        'data': {
          '__typename': 'Chicken',
          'id': 1,
          'inCoop': true,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'chickens',
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Chicken:2': {
        'data': {
          '__typename': 'Chicken',
          'id': 2,
          'inCoop': true,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'chickens',
              1,
            ],
          },
        ],
        'type': 0,
      },
      'Chicken:3': {
        'data': {
          '__typename': 'Chicken',
          'id': 3,
          'inCoop': false,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'chickens',
              2,
            ],
          },
        ],
        'type': 0,
      },
      'Duck:1': {
        'data': {
          '__typename': 'Duck',
          'id': 1,
          'quacking': true,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'ducks',
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Duck:2': {
        'data': {
          '__typename': 'Duck',
          'id': 2,
          'quacking': false,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'ducks',
              1,
            ],
          },
        ],
        'type': 0,
      },
      'Duck:3': {
        'data': {
          '__typename': 'Duck',
          'id': 3,
          'quacking': false,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'ducks',
              2,
            ],
          },
        ],
        'type': 0,
      },
      'Ox:1': {
        'data': {
          '__typename': 'Ox',
          'gee': true,
          'haw': false,
          'id': 1,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'oxen',
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Ox:2': {
        'data': {
          '__typename': 'Ox',
          'gee': false,
          'haw': true,
          'id': 2,
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'oxen',
              1,
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'chickens': [
            undefined,
            undefined,
            undefined,
          ],
          'ducks': [
            undefined,
            undefined,
            undefined,
          ],
          'oxen': [
            undefined,
            undefined,
          ],
        },
        'outbound': [
          {
            'id': 'Duck:1',
            'path': [
              'ducks',
              0,
            ],
          },
          {
            'id': 'Duck:2',
            'path': [
              'ducks',
              1,
            ],
          },
          {
            'id': 'Duck:3',
            'path': [
              'ducks',
              2,
            ],
          },
          {
            'id': 'Chicken:1',
            'path': [
              'chickens',
              0,
            ],
          },
          {
            'id': 'Chicken:2',
            'path': [
              'chickens',
              1,
            ],
          },
          {
            'id': 'Chicken:3',
            'path': [
              'chickens',
              2,
            ],
          },
          {
            'id': 'Ox:1',
            'path': [
              'oxen',
              0,
            ],
          },
          {
            'id': 'Ox:2',
            'path': [
              'oxen',
              1,
            ],
          },
        ],
        'type': 0,
      },
    });

    function diffChickens() {
      return cache.diff({
        query: gql`
          query {
            chickens {
              id
              inCoop
            }
          }
        `,
        optimistic: true,
      });
    }

    jestExpect(diffChickens()).toMatchObject({
      complete: true,
      result: {
        chickens: [
          { __typename: 'Chicken', id: 1, inCoop: true },
          { __typename: 'Chicken', id: 2, inCoop: true },
          { __typename: 'Chicken', id: 3, inCoop: false },
        ],
      },
    });

    jestExpect(
      cache.evict({
        id: cache.identify({
          __typename: 'Chicken',
          id: 2,
        }),
      })
    ).toBe(true);

    jestExpect(diffChickens()).toMatchObject({
      complete: false,
      missing: [
        new MissingFieldError(
          'Can\'t find field \'id\' on object {}',
          {
            chickens: {
              1: {
                id: 'Can\'t find field \'id\' on object {}',
                inCoop: 'Can\'t find field \'inCoop\' on object {}',
              },
            },
          },
          jestExpect.anything(), // query
          jestExpect.anything() // variables
        ),
        new MissingFieldError(
          'Can\'t find field \'inCoop\' on object {}',
          {
            chickens: {
              1: {
                id: 'Can\'t find field \'id\' on object {}',
                inCoop: 'Can\'t find field \'inCoop\' on object {}',
              },
            },
          },
          jestExpect.anything(), // query
          jestExpect.anything() // variables
        ),
      ],
      result: {
        chickens: [
          { __typename: 'Chicken', id: 1, inCoop: true },
          {},
          { __typename: 'Chicken', id: 3, inCoop: false },
        ],
      },
    });

    function diffDucks() {
      return cache.diff({
        query: gql`
          query {
            ducks {
              id
              quacking
            }
          }
        `,
        optimistic: true,
      });
    }

    jestExpect(diffDucks()).toMatchObject({
      complete: true,
      result: {
        ducks: [
          { __typename: 'Duck', id: 1, quacking: true },
          { __typename: 'Duck', id: 2, quacking: false },
          { __typename: 'Duck', id: 3, quacking: false },
        ],
      },
    });

    jestExpect(
      cache.evict({
        id: cache.identify({
          __typename: 'Duck',
          id: 3,
        }),
      })
    ).toBe(true);

    // Returning null as a placeholder in a list is a way to indicate that
    // a list element has been removed, without causing an incomplete
    // diff, and without altering the positions of later elements.
    jestExpect(diffDucks()).toMatchObject({
      complete: true,
      result: {
        ducks: [
          { __typename: 'Duck', id: 1, quacking: true },
          { __typename: 'Duck', id: 2, quacking: false },
          null,
        ],
      },
    });

    function diffOxen() {
      return cache.diff({
        query: gql`
          query {
            oxen {
              id
              gee
              haw
            }
          }
        `,
        optimistic: true,
      });
    }

    jestExpect(diffOxen()).toMatchObject({
      complete: true,
      result: {
        oxen: [
          { __typename: 'Ox', id: 1, gee: true, haw: false },
          { __typename: 'Ox', id: 2, gee: false, haw: true },
        ],
      },
    });

    jestExpect(
      cache.evict({
        id: cache.identify({
          __typename: 'Ox',
          id: 1,
        }),
      })
    ).toBe(true);

    jestExpect(diffOxen()).toMatchObject({
      complete: true,
      result: {
        oxen: [{ __typename: 'Ox', id: 2, gee: false, haw: true }],
      },
    });
  });

  it('propagates eviction signals to parent queries', () => {
    const cache = new Hermes({
      typePolicies: {
        Deity: {
          keyFields: ['name'],
          fields: {
            children(offspring: Reference[], { canRead }) {
              // Automatically filter out any dangling references, and
              // supply a default empty array if !offspring.
              return offspring ? offspring.filter(canRead) : [];
            },
          },
        },

        Query: {
          fields: {
            ruler(ruler, { canRead, toReference }) {
              // If the throne is empty, promote Apollo!
              return canRead(ruler)
                ? ruler
                : toReference({
                  __typename: 'Deity',
                  name: 'Apollo',
                });
            },
          },
        },
      },
    });

    const rulerQuery = gql`
      query {
        ruler {
          name
          children {
            name
            children {
              name
            }
          }
        }
      }
    `;

    const children = [
      // Sons #1 and #2 don't have names because Cronus (l.k.a. Saturn)
      // devoured them shortly after birth, as famously painted by
      // Francisco Goya:
      'Son #1',
      'Hera',
      'Son #2',
      'Zeus',
      'Demeter',
      'Hades',
      'Poseidon',
      'Hestia',
    ].map(name => ({
      __typename: 'Deity',
      name,
      children: [],
    }));

    cache.writeQuery({
      query: rulerQuery,
      data: {
        ruler: {
          __typename: 'Deity',
          name: 'Cronus',
          children,
        },
      },
    });

    const diffs: Cache.DiffResult<any>[] = [];

    function watch(immediate = true) {
      return cache.watch({
        query: rulerQuery,
        immediate,
        optimistic: true,
        callback(diff) {
          diffs.push(diff);
        },
      });
    }

    const cancel = watch();

    function devour(name: string) {
      return cache.evict({
        id: cache.identify({ __typename: 'Deity', name }),
      });
    }

    const initialDiff = {
      result: {
        ruler: {
          __typename: 'Deity',
          name: 'Cronus',
          children,
        },
      },
      complete: true,
    };

    // We already have one diff because of the immediate:true above.
    jestExpect(diffs).toMatchObject([initialDiff]);

    jestExpect(devour('Son #1')).toBe(true);

    const childrenWithoutSon1 = children.filter(
      child => child.name !== 'Son #1'
    );

    jestExpect(childrenWithoutSon1.length).toBe(children.length - 1);

    const diffWithoutSon1 = {
      result: {
        ruler: {
          name: 'Cronus',
          __typename: 'Deity',
          children: childrenWithoutSon1,
        },
      },
      complete: true,
    };

    jestExpect(diffs).toMatchObject([initialDiff, diffWithoutSon1]);

    jestExpect(devour('Son #1')).toBe(false);

    jestExpect(diffs).toMatchObject([initialDiff, diffWithoutSon1]);

    jestExpect(devour('Son #2')).toBe(true);

    const diffWithoutDevouredSons = {
      result: {
        ruler: {
          name: 'Cronus',
          __typename: 'Deity',
          children: childrenWithoutSon1.filter((child) => {
            return child.name !== 'Son #2';
          }),
        },
      },
      complete: true,
    };

    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
    ]);

    const childrenOfZeus = [
      'Ares',
      'Artemis',
      // Fun fact: Apollo is the only major Greco-Roman deity whose name
      // is the same in both traditions.
      'Apollo',
      'Athena',
    ].map(name => ({
      __typename: 'Deity',
      name,
      children: [],
    }));

    const zeusRef = cache.writeFragment({
      id: cache.identify({
        __typename: 'Deity',
        name: 'Zeus',
      }),
      fragment: gql`
        fragment Offspring on Deity {
          children {
            name
          }
        }
      `,
      data: {
        children: childrenOfZeus,
      },
    });

    jestExpect(isReference(zeusRef)).toBe(true);
    jestExpect(zeusRef!.__ref).toBe('Deity:{"name":"Zeus"}');

    const diffWithChildrenOfZeus = {
      complete: true,
      result: {
        ...diffWithoutDevouredSons.result,
        ruler: {
          ...diffWithoutDevouredSons.result.ruler,
          children: diffWithoutDevouredSons.result.ruler.children.map(
            (child) => {
              return child.name === 'Zeus'
                ? {
                  ...child,
                  children: childrenOfZeus
                  // Remove empty child.children arrays.
                    .map(({ children: _children, ..._child }) => _child),
                }
                : child;
            }
          ),
        },
      },
    };

    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
    ]);

    // Zeus usurps the throne from Cronus!
    cache.writeQuery({
      query: rulerQuery,
      data: {
        ruler: {
          __typename: 'Deity',
          name: 'Zeus',
        },
      },
    });

    const diffWithZeusAsRuler = {
      complete: true,
      result: {
        ruler: {
          __typename: 'Deity',
          name: 'Zeus',
          children: childrenOfZeus,
        },
      },
    };

    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
    ]);

    jestExpect(cache.gc().sort()).toEqual([] ?? [
      'Deity:{"name":"Cronus"}',
      'Deity:{"name":"Demeter"}',
      'Deity:{"name":"Hades"}',
      'Deity:{"name":"Hera"}',
      'Deity:{"name":"Hestia"}',
      'Deity:{"name":"Poseidon"}',
    ]);

    const snapshotAfterGC = {
      'Deity:{"name":"Apollo"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Apollo',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              2,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Ares"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Ares',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              0,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Artemis"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Artemis',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              1,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Athena"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Athena',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              3,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Zeus"}': {
        'data': {
          '__typename': 'Deity',
          'children': [
            undefined,
            undefined,
            undefined,
            undefined,
          ],
          'name': 'Zeus',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'ruler',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Deity:{"name":"Ares"}',
            'path': [
              'children',
              0,
            ],
          },
          {
            'id': 'Deity:{"name":"Artemis"}',
            'path': [
              'children',
              1,
            ],
          },
          {
            'id': 'Deity:{"name":"Apollo"}',
            'path': [
              'children',
              2,
            ],
          },
          {
            'id': 'Deity:{"name":"Athena"}',
            'path': [
              'children',
              3,
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'ruler': undefined,
        },
        'outbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'ruler',
            ],
          },
        ],
        'type': 0,
      },
    };

    jestExpect(cache.extract()).toEqual(snapshotAfterGC);

    // There should be no diff generated by garbage collection.
    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
    ]);

    cancel();

    const lastDiff = diffs[diffs.length - 1];

    jestExpect(
      cache.readQuery({
        query: rulerQuery,
      })
    ).toEqual(lastDiff.result); // TODO toBe

    jestExpect(
      cache.evict({
        id: cache.identify({
          __typename: 'Deity',
          name: 'Ares',
        }),
      })
    ).toBe(true);

    // No new diff generated since we called cancel() above.
    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
    ]);

    const snapshotWithoutAres = {
      'Deity:{"name":"Apollo"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Apollo',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              2,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Artemis"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Artemis',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              1,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Athena"}': {
        'data': {
          '__typename': 'Deity',
          'children': [],
          'name': 'Athena',
        },
        'inbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'children',
              3,
            ],
          },
        ],
        'type': 0,
      },
      'Deity:{"name":"Zeus"}': {
        'data': {
          '__typename': 'Deity',
          'children': [
            null,
            undefined,
            undefined,
            undefined,
          ],
          'name': 'Zeus',
        },
        'inbound': [
          {
            'id': 'ROOT_QUERY',
            'path': [
              'ruler',
            ],
          },
        ],
        'outbound': [
          {
            'id': 'Deity:{"name":"Artemis"}',
            'path': [
              'children',
              1,
            ],
          },
          {
            'id': 'Deity:{"name":"Apollo"}',
            'path': [
              'children',
              2,
            ],
          },
          {
            'id': 'Deity:{"name":"Athena"}',
            'path': [
              'children',
              3,
            ],
          },
        ],
        'type': 0,
      },
      'ROOT_QUERY': {
        'data': {
          'ruler': undefined,
        },
        'outbound': [
          {
            'id': 'Deity:{"name":"Zeus"}',
            'path': [
              'ruler',
            ],
          },
        ],
        'type': 0,
      },
    };
    jestExpect(cache.extract()).toEqual(snapshotWithoutAres);
    // Ares already removed, so no new garbage to collect.
    jestExpect(cache.gc()).toEqual([]);

    const childrenOfZeusWithoutAres = childrenOfZeus.filter((child) => {
      return child.name !== 'Ares';
    });

    jestExpect(childrenOfZeusWithoutAres).toEqual([
      { __typename: 'Deity', name: 'Artemis', children: [] },
      { __typename: 'Deity', name: 'Apollo', children: [] },
      { __typename: 'Deity', name: 'Athena', children: [] },
    ]);

    jestExpect(
      cache.readQuery({
        query: rulerQuery,
      })
    ).toEqual({
      ruler: {
        __typename: 'Deity',
        name: 'Zeus',
        children: childrenOfZeusWithoutAres,
      },
    });

    jestExpect(
      cache.evict({
        id: cache.identify({
          __typename: 'Deity',
          name: 'Zeus',
        }),
      })
    ).toBe(true);

    // You didn't think we were going to let Apollo be garbage-collected,
    // did you?
    cache.retain(
      cache.identify({
        __typename: 'Deity',
        name: 'Apollo',
      })!
    );

    jestExpect(cache.gc().sort()).toEqual([
      'Deity:{"name":"Artemis"}',
      'Deity:{"name":"Athena"}',
    ]);

    jestExpect(cache.extract()).toEqual({
      ROOT_QUERY: {
        data: {
          ruler: null,
        },
        type: 0,
      },
      'Deity:{"name":"Apollo"}': {
        data: {
          __typename: 'Deity',
          name: 'Apollo',
          children: [],
        },
        type: 0,
      },
    });

    const apolloRulerResult = cache.readQuery<{
      ruler: Record<string, any>,
    }>({ query: rulerQuery })!;

    jestExpect(apolloRulerResult).toEqual({
      ruler: {
        __typename: 'Deity',
        name: 'Apollo',
        children: [],
      },
    });

    // No new diffs since before.
    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
    ]);

    // Rewatch the rulerQuery, but avoid delivering an immediate initial
    // result (by passing false), so that we can use cache.modify to
    // trigger the delivery of diffWithApolloAsRuler below.
    const cancel2 = watch(false);

    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
    ]);

    cache.modify({
      fields: {
        ruler(_value, { toReference }) {
          /* TODO
          jestExpect(isReference(value)).toBe(true);
          jestExpect(value.__ref).toBe(
            cache.identify(diffWithZeusAsRuler.result.ruler)
          );
          jestExpect(value.__ref).toBe('Deity:{"name":"Zeus"}');
          */
          // Interim ruler Apollo takes over for real.
          return toReference(apolloRulerResult.ruler);
        },
      },
    });

    cancel2();

    const diffWithApolloAsRuler = {
      complete: true,
      result: apolloRulerResult,
    };

    // The cache.modify call should have triggered another diff, since we
    // overwrote the ROOT_QUERY.ruler field with a valid Reference to the
    // Apollo entity object.
    jestExpect(diffs).toMatchObject([
      initialDiff,
      diffWithoutSon1,
      diffWithoutDevouredSons,
      diffWithChildrenOfZeus,
      diffWithZeusAsRuler,
      diffWithApolloAsRuler,
    ]);

    jestExpect(
      // Undo the cache.retain call above.
      cache.release(
        cache.identify({
          __typename: 'Deity',
          name: 'Apollo',
        })!
      )
    ).toBe(0);

    // Since ROOT_QUERY.ruler points to Apollo, nothing needs to be
    // garbage collected.
    jestExpect(cache.gc()).toEqual([]);

    // Having survived GC, Apollo reigns supreme atop Olympus... or
    // something like that.
    jestExpect(cache.extract()).toEqual({
      ROOT_QUERY: {
        data: {
          ruler: undefined,
        },
        outbound: [
          {
            id: 'Deity:{"name":"Apollo"}',
            path: [
              'ruler',
            ],
          },
        ],
        type: 0,
      },
      'Deity:{"name":"Apollo"}': {
        data: {
          __typename: 'Deity',
          name: 'Apollo',
          children: [],
        },
        inbound: [
          {
            id: 'ROOT_QUERY',
            path: [
              'ruler',
            ],
          },
        ],
        type: 0,
      },
    });
  });

  it('returns === results for different queries', () => {
    const cache = new Hermes({
    });

    const aQuery: TypedDocumentNode<{
      a: string[],
    }> = gql`
      query {
        a
      }
    `;

    const abQuery: TypedDocumentNode<{
      a: string[],
      b: {
        c: string,
        d: string,
      },
    }> = gql`
      query {
        a
        b {
          c
          d
        }
      }
    `;

    const bQuery: TypedDocumentNode<{
      b: {
        c: string,
        d: string,
      },
    }> = gql`
      query {
        b {
          d
          c
        }
      }
    `;

    const abData1 = {
      a: ['a', 'y'],
      b: {
        c: 'see',
        d: 'dee',
      },
    };

    cache.writeQuery({
      query: abQuery,
      data: abData1,
    });

    function read<Data, Vars>(query: TypedDocumentNode<Data, Vars>) {
      return cache.readQuery({ query })!;
    }

    const aResult1 = read(aQuery);
    const abResult1 = read(abQuery);
    const bResult1 = read(bQuery);

    jestExpect(aResult1.a).toBe(abResult1.a);
    jestExpect(abResult1).toEqual(abData1);
    jestExpect(aResult1).toMatchObject({ a: abData1.a });
    jestExpect(bResult1).toMatchObject({ b: abData1.b });
    // jestExpect(abResult1.b).toBe(bResult1.b); TODO

    const aData2 = {
      a: 'ayy'.split(''),
    };

    cache.writeQuery({
      query: aQuery,
      data: aData2,
    });

    const aResult2 = read(aQuery);
    const abResult2 = read(abQuery);
    // const bResult2 = read(bQuery);

    jestExpect(aResult2).toMatchObject(aData2);
    jestExpect(abResult2).toEqual({ ...abData1, ...aData2 });
    jestExpect(aResult2.a).toBe(abResult2.a);
    // jestExpect(bResult2.b).toBe(bResult1.b); todo
    // jestExpect(abResult2.b).toBe(bResult2.b);
    // jestExpect(abResult2.b).toBe(bResult1.b);

    const bData3 = {
      b: {
        d: 'D',
        c: 'C',
      },
    };

    cache.writeQuery({
      query: bQuery,
      data: bData3,
    });

    const aResult3 = read(aQuery);
    const abResult3 = read(abQuery);
    const bResult3 = read(bQuery);

    jestExpect(aResult3.a).toBe(aResult2.a);
    jestExpect(bResult3).toMatchObject(bData3);
    jestExpect(bResult3).not.toBe(bData3);
    jestExpect(abResult3).toEqual({
      ...abResult2,
      ...bData3,
    });

    jestExpect(cache.extract()).toMatchSnapshot();
  });

  it('does not canonicalize custom scalar objects', () => {
    const now = new Date();
    const abc = { a: 1, b: 2, c: 3 };

    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            now() {
              return now;
            },

            abc() {
              return abc;
            },
          },
        },
      },
    });

    const query: TypedDocumentNode<{
      now: typeof now,
      abc: typeof abc,
    }> = gql`
      query {
        now
        abc
      }
    `;

    const result1 = cache.readQuery({ query })!;
    const result2 = cache.readQuery({ query })!;

    jestExpect(result1).toBe(result2);
    jestExpect(result1.now).toBeInstanceOf(Date);

    // We already know result1.now === result2.now, but it's also
    // important that it be the very same (===) Date object that was
    // returned from the read function for the Query.now field, not a
    // canonicalized version.
    jestExpect(result1.now).toBe(now);
    jestExpect(result2.now).toBe(now);

    // The Query.abc field returns a "normal" object, but we know from the
    // structure of the query that it's a scalar object, so it will not be
    // canonicalized.
    jestExpect(result1.abc).toEqual(abc);
    jestExpect(result2.abc).toEqual(abc);
    jestExpect(result1.abc).toBe(result2.abc);
    jestExpect(result1.abc).toBe(abc);
    jestExpect(result2.abc).toBe(abc);
  });
});
