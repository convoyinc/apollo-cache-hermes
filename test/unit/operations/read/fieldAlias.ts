import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { read, write } from '../../../../src/operations';
import { query } from '../../../helpers';

describe(`operations.read`, () => {
  const context = new CacheContext();

  const empty = new GraphSnapshot();

  describe(`field alias`, () => {
    describe(`without parameterized arguments`, () => {
      it(`simple alias`, () => {
        const aliasQuery = query(`{
          user {
            userId: id
            userName: name
          }
        }`);

        const snapshot = write(context, empty, aliasQuery, {
          user: {
            userId: 0,
            userName: 'Foo',
          },
        }).snapshot;

        const { result } = read(context, aliasQuery, snapshot);
        expect(result).to.deep.eq({
          user: {
            id: 0,
            userId: 0,
            name: 'Foo',
            userName: 'Foo',
          },
        });
      });

      it(`nested alias`, () => {
        const aliasQuery = query(`{
          superUser: user {
            userId: id
            userName: name
          }
          user {
            id
            name
          }
        }`);

        const snapshot = write(context, empty, aliasQuery, {
          superUser: {
            userId: 0,
            userName: 'Foo',
          },
          user: {
            id: 100,
            name: 'Baz',
          },
        }).snapshot;

        const { result } = read(context, aliasQuery, snapshot);
        expect(result).to.deep.eq({
          superUser: {
            id: 100,
            userId: 100,
            name: 'Baz',
            userName: 'Baz',
          },
          user: {
            id: 100,
            name: 'Baz',
          },
        });
      });
    });

    describe(`with parameterized arguments`, () => {
      it(`simple alias`, () => {
        const aliasQuery = query(`{
          superUser: user(id: 4) {
            ID: id
            FirstName: name
          }
        }`);

        const snapshot = write(context, empty, aliasQuery, {
          superUser: {
            ID: 0,
            FirstName: 'Baz',
          },
        }).snapshot;

        const { result } = read(context, aliasQuery, snapshot);
        expect(result).to.deep.eq({
          superUser: {
            id: 0,
            ID: 0,
            name: 'Baz',
            FirstName: 'Baz',
          },
        });
      });

      it(`with variables`, () => {
        const aliasQuery = query(`
          query getUser($id: ID!) {
            fullUser: user(id: $id) {
              firstName: FirstName,
              id
              address: Address {
                city
                state
              }
            }
            user(id: $id) {
              FirstName
              id
            }
          }
        `, { id: 2 });
        const snapshot = write(context, empty, aliasQuery, {
          fullUser: {
            firstName: 'Bob',
            id: 2,
            address: {
              city: 'A',
              state: 'AA',
            },
          },
          user: {
            FirstName: 'Bob',
            id: 2,
          },
        }).snapshot;

        const { result } = read(context, aliasQuery, snapshot);
        expect(result).to.deep.eq({
          fullUser: {
            firstName: 'Bob',
            FirstName: 'Bob',
            id: 2,
            address: {
              city: 'A',
              state: 'AA',
            },
            Address: {
              city: 'A',
              state: 'AA',
            },
          },
          user: {
            FirstName: 'Bob',
            id: 2,
            Address: {
              city: 'A',
              state: 'AA',
            },
          },
        });
      });

      it(`complex nested alias`, () => {
        const nestedAliasQuery = query(`{
          shipments(first: 2) {
            shipmentsInfo: edges {
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

        const { result } = read(context, nestedAliasQuery, snapshot);
        expect(result).to.deep.eq({
          shipments: {
            shipmentsInfo: [
              {
                id: 0,
                loads: [{ type: '26 Pallet', shipmentItemType: '26 Pallet' }, { type: 'Other', shipmentItemType: 'Other' }],
                contents: [{ shipmentItemType: '26 Pallet' }, { shipmentItemType: 'Other' }],
                shipmentSize: { weight: 1000, unit: 'lb', weightUnit: 'lb' },
                dimensions: { weight: 1000, weightUnit: 'lb' },
              },
              {
                id: 1,
                loads: [{ type: '24 Pallet', shipmentItemType: '24 Pallet' }, { type: 'Other', shipmentItemType: 'Other' }],
                contents: [{ shipmentItemType: '24 Pallet' }, { shipmentItemType: 'Other' }],
                shipmentSize: { weight: 2000, unit: 'lb', weightUnit: 'lb' },
                dimensions: { weight: 2000, weightUnit: 'lb' },
              },
            ],
            edges: [
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
          },
        });
      });
    });
  });
});
