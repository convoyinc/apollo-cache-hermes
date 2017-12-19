import gql from 'graphql-tag';

import { Hermes } from '../../../../src/apollo/Hermes';
import { CacheContext } from '../../../../src/context/CacheContext';
import { EntitySnapshot } from '../../../../src/nodes/EntitySnapshot';
import { ParameterizedValueSnapshot } from '../../../../src/nodes/ParameterizedValueSnapshot';
import { nodeIdForParameterizedValue } from '../../../../src/operations/SnapshotEditor';
import { StaticNodeId } from '../../../../src/schema';
import { strictConfig } from '../../../helpers/context';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`Hermes Apollo API`, () => {
  describe(`writeFragment with nested paramterized value`, () => {

    let hermes: Hermes;
    beforeAll(() => {
      hermes = new Hermes(new CacheContext(strictConfig));
      hermes.writeQuery({
        query: gql(`
          query getViewer {
            viewer {
              id
              name
              __typename
              trucks(number: 2) {
                name
                year
              }
            }
          }
        `),
        data: {
          viewer: {
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
            trucks: [
              {
                name: 'truck0',
                year: '1998',
              },
            ],
          },
        },
      });
    });

    it(`correctly add parameterized value`, () => {
      hermes.writeFragment({
        id: '123',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            trucks(number: 2) {
              name
              year
              driverName
            }
          }
        `),
        data: {
          id: 123,
          trucks: [
            {
              name: 'truck0',
              year: '1998',
              driverName: 'Bob',
            },
            {
              name: 'truck1',
              year: '1997',
              driverName: 'Bob',
            },
          ],
        },
      });

      const parameterizedTruckId = nodeIdForParameterizedValue(
        '123',
        ['trucks'],
        { number: 2 }
      );

      expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('123')).to.deep.eq(
        new EntitySnapshot(
          {
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
          },
          [{ id: QueryRootId, path: ['viewer'] }],
          [{ id: parameterizedTruckId, path: ['trucks'] }]
        )
      );

      expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedTruckId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          [
            {
              name: 'truck0',
              year: '1998',
              driverName: 'Bob',
            },
            {
              name: 'truck1',
              year: '1997',
              driverName: 'Bob',
            },
          ],
          [{ id: '123', path: ['trucks'] }]
        )
      );
    });

    it(`correctly overwrite parameterized value`, () => {
      hermes.writeFragment({
        id: '123',
        fragment: gql(`
          fragment viewer on Viewer {
            id
            trucks(number: 2) {
              name
              year
              driverName
            }
          }
        `),
        data: {
          id: 123,
          trucks: [
            {
              name: 'truck0',
              year: '1998',
              driverName: 'Bob',
            },
          ],
        },
      });

      const parameterizedTruckId = nodeIdForParameterizedValue(
        '123',
        ['trucks'],
        { number: 2 }
      );

      expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot('123')).to.deep.eq(
        new EntitySnapshot(
          {
            id: 123,
            name: 'Gouda',
            __typename: 'Viewer',
          },
          [{ id: QueryRootId, path: ['viewer'] }],
          [{ id: parameterizedTruckId, path: ['trucks'] }]
        )
      );

      expect(hermes.getCurrentCacheSnapshot().baseline.getNodeSnapshot(parameterizedTruckId)).to.deep.eq(
        new ParameterizedValueSnapshot(
          [
            {
              name: 'truck0',
              year: '1998',
              driverName: 'Bob',
            },
          ],
          [{ id: '123', path: ['trucks'] }]
        )
      );
    });

  });
});
