import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.read`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();
  const parameterizedQuery = query(`
    query getAFoo($id: ID!) {
      user(id: $id, withExtra: true) {
        id name extra
      }
      stuff
    }
  `, { id: 1 });

  describe(`parameterized fields`, () => {

    describe(`with a complete cache`, () => {

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        snapshot = write(context, empty, parameterizedQuery, {
          user: { id: 1, name: 'Foo', extra: true },
          stuff: 123,
        }).snapshot;
      });

      it(`returns the selected values, overlaid on the underlying data`, () => {
        const { result } = read(context, parameterizedQuery, snapshot);
        jestExpect(result).toEqual({
          user: { id: 1, name: 'Foo', extra: true },
          stuff: 123,
        });
      });

      it(`returns the nodeIds visited during reading`, () => {
        const { nodeIds } = read(context, parameterizedQuery, snapshot, true);
        jestExpect(Array.from(nodeIds).sort()).toEqual([
          QueryRootId,
          nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 1, withExtra: true }),
          '1',
        ].sort());
      });

    });

    describe(`with nested fields`, () => {

      const nestedQuery = query(`query nested($id: ID!) {
        one {
          two(id: $id) {
            id
            three {
              four(extra: true) {
                five
              }
            }
          }
        }
      }`, { id: 1 });

      describe(`and a full store`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, {
            one: {
              two: [
                {
                  id: 1,
                  three: {
                    four: { five: 1 },
                  },
                },
                {
                  id: 2,
                  three: {
                    four: { five: 2 },
                  },
                },
              ],
            },
          }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({
            one: {
              two: [
                {
                  id: 1,
                  three: {
                    four: { five: 1 },
                  },
                },
                {
                  id: 2,
                  three: {
                    four: { five: 2 },
                  },
                },
              ],
            },
          });
        });

        it(`returns the nodeIds visited during reading`, () => {
          const { nodeIds } = read(context, nestedQuery, snapshot, true);
          jestExpect(Array.from(nodeIds).sort()).toEqual([
            QueryRootId,
            nodeIdForParameterizedValue(QueryRootId, ['one', 'two'], { id: 1 }),
            '1',
            nodeIdForParameterizedValue('1', ['three', 'four'], { extra: true }),
            '2',
            nodeIdForParameterizedValue('2', ['three', 'four'], { extra: true }),
          ].sort());
        });

      });

      describe(`and an empty store`, () => {

        it(`doesn't recurse to nested fields if there are no values for their parent`, () => {
          const { result } = read(context, nestedQuery, empty);
          jestExpect(result).toEqual(undefined);
        });

        it(`is marked incomplete`, () => {
          const { complete } = read(context, nestedQuery, empty);
          jestExpect(complete).toBe(false);
        });

      });

      describe(`and an empty value`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, {
            one: {
              two: [
                {
                  id: 1,
                  three: {
                    four: [],
                  },
                },
              ],
            },
          }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({
            one: {
              two: [
                {
                  id: 1,
                  three: {
                    four: [],
                  },
                },
              ],
            },
          });
        });

      });

      describe(`and a null container`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, { one: null }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({ one: null });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          jestExpect(complete).toBe(true);
        });

      });

      describe(`and a null root snapshot`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, {
            one: {
              two: null,
            },
          }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({
            one: {
              two: null,
            },
          });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          jestExpect(complete).toBe(true);
        });

      });

      describe(`and a null intermediate node`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, {
            one: {
              two: {
                id: 1,
                three: null,
              },
            },
          }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({
            one: {
              two: {
                id: 1,
                three: null,
              },
            },
          });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          jestExpect(complete).toBe(true);
        });

      });

      describe(`in an array with holes`, () => {

        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, nestedQuery, {
            one: [
              null,
              {
                two: {
                  id: 1,
                  three: null,
                },
              },
            ],
          }).snapshot;
        });

        it(`returns the selected values, overlaid on the underlying data`, () => {
          const { result } = read(context, nestedQuery, snapshot);
          jestExpect(result).toEqual({
            one: [
              null,
              {
                two: {
                  id: 1,
                  three: null,
                },
              },
            ],
          });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          jestExpect(complete).toBe(true);
        });

      });

    });

    describe(`directly nested reference fields`, () => {

      const nestedQuery = query(`
      query nested($id: ID!) {
        one(id: $id) {
          id
          two(extra: true) {
            id
          }
        }
      }`, { id: 1 });

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        snapshot = write(context, empty, nestedQuery, {
          one: {
            id: 1,
            two: { id: 2 },
          },
        }).snapshot;
      });

      it(`returns the selected values, overlaid on the underlying data`, () => {
        const { result } = read(context, nestedQuery, snapshot);
        jestExpect(result).toEqual({
          one: {
            id: 1,
            two: { id: 2 },
          },
        });
      });

    });

    describe(`directly nested reference without any simple fields on the intermediate object`, () => {

      const nestedQuery = query(`
      query nested($id: ID!) {
        one(id: $id) {
          # Notice, no simple fields on one
          two(extra: true) {
            id
          }
        }
      }`, { id: 1 });

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        snapshot = write(context, empty, nestedQuery, {
          one: {
            two: { id: 2 },
          },
        }).snapshot;
      });

      it(`returns the selected values, overlaid on the underlying data`, () => {
        const { result } = read(context, nestedQuery, snapshot);
        jestExpect(result).toEqual({
          one: {
            two: { id: 2 },
          },
        });
      });

    });

    describe(`with a value of []`, () => {

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        snapshot = write(context, empty, parameterizedQuery, {
          user: [],
          stuff: 123,
        }).snapshot;
      });

      it(`returns the selected values, overlaid on the underlying data`, () => {
        const { result } = read(context, parameterizedQuery, snapshot);
        jestExpect(result).toEqual({
          user: [],
          stuff: 123,
        });
      });

    });

  });

  describe(`with @static fields`, () => {

    const staticQuery = query(`{
      todos {
        id
        value: rawValue @static
        history(limit: 2) @static {
          changeType
          value
        }
      }
    }`);

    const otherStaticQuery = query(`{
      todos {
        id
        value: rawValue @static
        history(limit: 2) @static {
          value
        }
      }
    }`);

    let snapshot: GraphSnapshot;
    beforeAll(() => {
      snapshot = write(context, empty, staticQuery, {
        todos: [
          {
            id: 1,
            value: 'hello',
            history: [
              {
                changeType: 'edit',
                value: 'ohai',
              },
              {
                changeType: 'edit',
                value: 'hey',
              },
            ],
          },
        ],
      }).snapshot;
    });

    it(`can be read`, () => {
      const { result } = read(context, staticQuery, snapshot);
      jestExpect(result).toEqual({
        todos: [
          {
            id: 1,
            value: 'hello',
            history: [
              {
                changeType: 'edit',
                value: 'ohai',
              },
              {
                changeType: 'edit',
                value: 'hey',
              },
            ],
          },
        ],
      });
    });

    it(`is the same object between reads`, () => {
      const result1 = read(context, staticQuery, snapshot).result;
      const result2 = read(context, otherStaticQuery, snapshot).result;

      jestExpect(result1).toBe(result2);
    });

  });

});
