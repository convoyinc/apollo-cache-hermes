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

    describe(`without parameterized arguments`, () => {
      describe(`simple query alias on a leaf field`, () => {
        let aliasQuery: RawOperation, snapshot: GraphSnapshot;
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
          expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
        let aliasQuery: RawOperation, snapshot: GraphSnapshot;
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
          expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
        let aliasQuery: RawOperation, snapshot: GraphSnapshot;
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
          expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
        expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
        let aliasQuery: RawOperation, snapshot: GraphSnapshot;
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
          expect(snapshot.getNodeData(QueryRootId)).to.deep.eq({
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
            data: {
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

  });

});
