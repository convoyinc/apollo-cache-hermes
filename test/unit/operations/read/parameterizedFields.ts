import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { query, strictConfig } from '../../../helpers';

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
        expect(result).to.deep.equal({
          user: { id: 1, name: 'Foo', extra: true },
          stuff: 123,
        });
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
          expect(result).to.deep.equal({
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

      });

      describe(`and an empty store`, () => {

        it(`doesn't recurse to nested fields if there are no values for their parent`, () => {
          const { result } = read(context, nestedQuery, empty);
          expect(result).to.deep.equal(undefined);
        });

        it(`is marked incomplete`, () => {
          const { complete } = read(context, nestedQuery, empty);
          expect(complete).to.eq(false);
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
          expect(result).to.deep.equal({
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
          expect(result).to.deep.equal({ one: null });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          expect(complete).to.eq(true);
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
          expect(result).to.deep.equal({
            one: {
              two: null,
            },
          });
        });

        it(`is marked complete`, () => {
          const { complete } = read(context, nestedQuery, snapshot);
          expect(complete).to.eq(true);
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
          expect(result).to.deep.equal({
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
          expect(complete).to.eq(true);
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
          expect(result).to.deep.equal({
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
          expect(complete).to.eq(true);
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
        expect(result).to.deep.equal({
          one: {
            id: 1,
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
        expect(result).to.deep.equal({
          user: [],
          stuff: 123,
        });
      });

    });

  });

});
