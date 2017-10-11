import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { nodeIdForParameterizedValue } from '../../../../../src/operations/SnapshotEditor';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
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

    describe(`with parameterized arguments`, () => {
      it(`simple query`, () => {
        const aliasQuery = query(`{
          superUser: user(id: 4) {
            ID: id
            FirstName: name
          }
        }`);

        const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
        const snapshot = write(context, empty, aliasQuery, {
          superUser: {
            ID: 0,
            FirstName: 'Baz',
          },
        }).snapshot;

        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
          id: 0,
          name: 'Baz',
        });
      });

      it(`simple query with variables`, () => {
        const aliasQuery = query(`
          query getUser($id: ID!) {
            superUser: user(id: $id) {
              ID: id
              FirstName: name
            }
          }
        `, { id: 4 });

        const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });
        const snapshot = write(context, empty, aliasQuery, {
          superUser: {
            ID: 0,
            FirstName: 'Baz',
          },
        }).snapshot;

        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
          id: 0,
          name: 'Baz',
        });
      });

      it(`complex query`, () => {
        const nestedAliasQuery = query(`{
          shipments(first: 2) {
            shipmentsInfo: fields {
              id
              loads: contents {
                type: shipmentItemType
              }
              shipmentSize: dimensions {
                weight
                unit: weightUnit
              }
            }
          }
        }`);

        const snapshot = write(context, empty, nestedAliasQuery, {
          shipments: {
            shipmentsInfo: [
              {
                id: 0,
                loads: [{ type: '26 Pallet' }, { type: 'Other' }],
                shipmentSize: { weight: 1000, unit: 'lb' },
              },
              {
                id: 1,
                loads: [{ type: '24 Pallet' }, { type: 'Other' }],
                shipmentSize: { weight: 2000, unit: 'lb' },
              },
            ],
          },
        }).snapshot;

        const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['shipments'], { first: 2 });

        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
          fields: [
            {
              id: 0,
              contents: [{ shipmentItemType: '26 Pallet' }, { shipmentItemType: 'Other' }],
              dimensions: { weight: 1000, weightUnit: 'lb' },
            },
            {
              id: 1,
              contents: [{ shipmentItemType: '24 Pallet' }, { shipmentItemType: 'Other' }],
              dimensions: { weight: 2000, weightUnit: 'lb' },
            },
          ],
        });
      });

      it(`alias and non-alias`, () => {
        const aliasQuery = query(`{
          fullUser: user(id: 4) {
            id
            FirstName: name
            contact: contactInfo {
              shortAddress: address {
                city
                state
              }
              phone
            }
          }
          shortUser: user (id: 4) {
            id
            FirstName: name
            contact: contactInfo {
              phone
            }
          }
          user (id: 4) {
            id
            name
          }
        }`);
        const parameterizedId = nodeIdForParameterizedValue(QueryRootId, ['user'], { id: 4 });

        const snapshot = write(context, empty, aliasQuery, {
          fullUser: {
            id: 4,
            FirstName: 'Foo',
            contact: {
              shortAddress: {
                city: 'ABA',
                state: 'AA',
              },
              phone: '555-555-5555',
            },
          },
          shortUser: {
            id: 4,
            FirstName: 'Foo',
            contact: {
              phone: '555-555-5555',
            },
          },
          user: {
            id: 4,
            name: 'Foo',
          },
        }).snapshot;

        expect(snapshot.getNodeData(parameterizedId)).to.deep.eq({
          id: 4,
          name: 'Foo',
          contactInfo: {
            address: {
              city: 'ABA',
              state: 'AA',
            },
            phone: '555-555-5555',
          },
        });
      });

    });

  });

});
