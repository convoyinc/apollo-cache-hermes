import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../../src/nodes';
import { write } from '../../../../../src/operations/write';
import { RawOperation, StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`field alias`, () => {

    describe(`query with both alias and non-alias to same field`, () => {
      let mixQuery: RawOperation;
      beforeAll(() => {
        mixQuery = query(`
          query GetUser {
            fullUserInfo: user {
              id
              FirstName: name
              contact: phone
            }
            user {
              id
              name
            }
          }
        `);
      });

      describe(`payload with aliases first`, () => {
        let snapshot: GraphSnapshot;
        beforeAll(() => {
          snapshot = write(context, empty, mixQuery, {
            fullUserInfo: {
              id: 0,
              FirstName: 'Foo',
              contact: '555-555-5555',
            },
            user: {
              id: 0,
              name: 'Foo',
            },
          }).snapshot;
        });

        it(`only writes fields from the schema`, () => {
          expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
            user: {
              id: 0,
              name: 'Foo',
              phone: '555-555-5555',
            },
          });
        });

        it(`check shape of GraphNodeSnapshot`, () => {
          expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(
            new EntitySnapshot(
              {
                user: {
                  id: 0,
                  name: 'Foo',
                  phone: '555-555-5555',
                },
              },
              /* inbound */ undefined,
              /* outbound */ [{ id: '0', path: ['user'] }],
            )
          );
        });
      });

      it(`payload with non-alias first`, () => {
        const snapshot = write(context, empty, mixQuery, {
          user: {
            id: 0,
            name: 'Foo',
          },
          fullUserInfo: {
            id: 0,
            FirstName: 'Foo',
            contact: '555-555-5555',
          },
        }).snapshot;
        expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
          user: {
            id: 0,
            name: 'Foo',
            phone: '555-555-5555',
          },
        });
      });

      it(`payload with conflict between alias and non-alias`, () => {
        const snapshot = write(context, empty, mixQuery, {
          user: {
            id: 0,
            name: 'Foo',
          },
          fullUserInfo: {
            id: 1,
            FirstName: 'FooBar',
            contact: '555-555-5555',
          },
        }).snapshot;
        expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
          user: {
            id: 1,
            name: 'FooBar',
            phone: '555-555-5555',
          },
        });
      });
    });

  });

});
