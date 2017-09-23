import { CacheContext } from '../../../../src/context';
import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { EntitySnapshot } from '../../../../src/nodes';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { write } from '../../../../src/operations/write';
import { Query, StaticNodeId } from '../../../../src/schema';
import { query, strictConfig } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

// These are really more like integration tests, given the underlying machinery.
//
// It just isn't very fruitful to unit test the individual steps of the write
// workflow in isolation, given the contextual state that must be passed around.
describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`field alias`, () => {

    describe(`without parameterized arguments`, () => {
      describe(`simple query alias on a leaf field`, () => {
        let aliasQuery: Query, snapshot: GraphSnapshot;
        beforeAll(() => {
          aliasQuery = query(`{
            user {
              id
              FirstName: name
            }
          }`);

          snapshot = write(context, empty, aliasQuery, {
            user: {
              id: 0,
              FirstName: 'Foo',
            },
          }).snapshot;
        });

        it(`only writes fields from the schema`, () => {
          expect(snapshot.get(QueryRootId)).to.deep.eq({
            user: {
              id: 0,
              name: 'Foo',
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
                },
              },
              /* inbound */ undefined,
              /* outbound */ [{ id: '0', path: ['user'] }],
            )
          );
        });
      });

      describe(`simple query alias on entityId`, () => {
        let aliasQuery: Query, snapshot: GraphSnapshot;
        beforeAll(() => {
          aliasQuery = query(`{
            user {
              userId: id
              FirstName: name
            }
          }`);

          snapshot = write(context, empty, aliasQuery, {
            user: {
              userId: 0,
              FirstName: 'Foo',
            },
          }).snapshot;
        });

        it(`only writes fields from the schema`, () => {
          expect(snapshot.get(QueryRootId)).to.deep.eq({
            user: {
              id: 0,
              name: 'Foo',
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
                },
              },
              /* inbound */ undefined,
              /* outbound */ undefined,
            )
          );
        });

        it(`check there is only one entity node, RootQuery`, () => {
          expect(snapshot.allNodeIds()).to.have.members([QueryRootId]);
        });
      });

      describe(`nested non entityId alias query`, () => {
        let aliasQuery: Query, snapshot: GraphSnapshot;
        beforeAll(() => {
          aliasQuery = query(`{
            user {
              info {
                FirstName: name
              }
            }
          }`);

          snapshot = write(context, empty, aliasQuery, {
            user: {
              info: {
                FirstName: 'Foo',
              },
            },
          }).snapshot;
        });

        it(`only writes fields from the schema`, () => {
          expect(snapshot.get(QueryRootId)).to.deep.eq({
            user: {
              info: {
                name: 'Foo',
              },
            },
          });
        });

        it(`check shape of graph`, () => {
          expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq(
            new EntitySnapshot(
              {
                user: {
                  info: {
                    name: 'Foo',
                  },
                },
              },
              /* inbound */ undefined,
              /* outbound */ undefined,
            )
          );
        });
      });

      it(`nested entityId alias`, () => {
        const nestedAliasQuery = query(`
          query GetUser {
            fullUserInfo: user {
              userId: id
              nickName
              FirstName: name
              contact {
                address: homeAddress {
                  city
                  state
                }
                phone
              }
            }
          }
        `);
        const snapshot = write(context, empty, nestedAliasQuery, {
          fullUserInfo: {
            userId: 0,
            nickName: 'Foo Foo',
            FirstName: 'Foo',
            contact: {
              address: {
                city: 'Seattle',
                state: 'WA',
              },
              phone: '555-555-5555',
            },
          },
        }).snapshot;
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          user: {
            id: 0,
            name: 'Foo',
            nickName: 'Foo Foo',
            contact: {
              homeAddress: {
                city: 'Seattle',
                state: 'WA',
              },
              phone: '555-555-5555',
            },
          },
        });
      });

      describe(`same alias name in different scope`, () => {
        let aliasQuery: Query, snapshot: GraphSnapshot;
        beforeAll(() => {
          aliasQuery = query(`{
            shipment: Shipment {
              id: shipmentId,
              name: shipmentName,
            }
            dispatch: Dispatcher {
              id
              name
            }
            carrier: Carrier {
              id: carrierId
              name: carrierName
            }
          }`);

          snapshot = write(context, empty, aliasQuery, {
            shipment: {
              id: 0,
              name: 'ToSeattle',
            },
            dispatch: {
              id: 2,
              name: 'Bob The dispatcher',
            },
            carrier: {
              id: 1,
              name: 'Bob',
            },
          }).snapshot;
        });

        it(`only writes fields from the schema`, () => {
          expect(snapshot.get(QueryRootId)).to.deep.eq({
            Shipment: {
              shipmentId: 0,
              shipmentName: 'ToSeattle',
            },
            Dispatcher: {
              id: 2,
              name: 'Bob The dispatcher',
            },
            Carrier: {
              carrierId: 1,
              carrierName: 'Bob',
            },
          });
        });

        it(`check shape of GraphNodeSnapshot`, () => {
          expect(snapshot.getNodeSnapshot(QueryRootId)).to.deep.eq({
            inbound: undefined,
            outbound: [{ id: '0', path: ['Shipment'] }, { id: '2', path: ['Dispatcher'] }, { id: '1', path: ['Carrier'] }],
            node: {
              Shipment: {
                shipmentId: 0,
                shipmentName: 'ToSeattle',
              },
              Dispatcher: {
                id: 2,
                name: 'Bob The dispatcher',
              },
              Carrier: {
                carrierId: 1,
                carrierName: 'Bob',
              },
            },
          });
        });
      });
    });

    describe(`query with both alias and non-alias to same field`, () => {
      let mixQuery: Query;
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
          expect(snapshot.get(QueryRootId)).to.deep.eq({
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
        expect(snapshot.get(QueryRootId)).to.deep.eq({
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
        expect(snapshot.get(QueryRootId)).to.deep.eq({
          user: {
            id: 1,
            name: 'FooBar',
            phone: '555-555-5555',
          },
        });
      });
    });

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

        expect(snapshot.get(parameterizedId)).to.deep.eq({
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

        expect(snapshot.get(parameterizedId)).to.deep.eq({
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

        expect(snapshot.get(parameterizedId)).to.deep.eq({
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

        expect(snapshot.get(parameterizedId)).to.deep.eq({
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
