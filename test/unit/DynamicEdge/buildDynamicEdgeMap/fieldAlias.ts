import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { buildDynamicEdgeMap, DynamicEdge, VariableArgument } from '../../../../src/DynamicEdge';
import { fragmentMapForDocument, getOperationOrDie } from '../../../../src/util';

describe(`util.ast`, () => {
  describe(`buildDynamicEdgeMap`, () => {
    function buildEdgeMapForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return buildDynamicEdgeMap(fragmentMap, operation.selectionSet);
    }

    describe(`with field alias`, () => {

      it(`simple query`, () => {
        const map = buildEdgeMapForOperation(gql`{
            user {
              ID: id,
              FirstName: name,
            },
          }
        `);
        expect(map).to.deep.eq({
          user: {
            ID: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'id'),
            FirstName: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'name'),
          },
        });
      });

      it(`nested alias`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getUser {
            superUser: user {
              ID: id
              FirstName: name
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            /* parameterizedEdgeArgs */ undefined,
            /* fiedlName */ 'user',
            {
              ID: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'id'),
              FirstName: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'name'),
            }
          ),
        });
      });

      it(`field alias with parameterized edge`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile {
            superUser: user(id: 4) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            { id: 4 },
            /* fieldName */ 'user',
            {
              ID: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'id'),
              Profile: new DynamicEdge({ width: 400, height: 200 }, /* fieldName */ 'picture'),
            },
          ),
        });
      });

      it(`field alias with variable parameterized edge`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile ($id: ID!) {
            superUser: user(id: $id) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicEdge(
            { id: new VariableArgument('id') },
            /* fieldName */ 'user',
            {
              ID: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, /* fiedlName */ 'id'),
              Profile: new DynamicEdge({ width: 400, height: 200 }, /* fieldName */ 'picture'),
            },
          ),
        });
      });

      it(`complex nested alias`, () => {
        const map = buildEdgeMapForOperation(gql`{
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

        expect(map).to.deep.eq({
          shipments: new DynamicEdge(
            { first: 2 },
            /* fieldName */ undefined,
            {
              shipmentsInfo: new DynamicEdge(
                /* parameterizedEdgeArgs */ undefined,
                'edges',
                {
                  loads: new DynamicEdge(
                    /* parameterizedEdgeArgs */ undefined,
                    'contents',
                    {
                      type: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, 'shipmentItemType'),
                    }
                  ),
                  shipmentSize: new DynamicEdge(
                    /* parameterizedEdgeArgs */ undefined,
                    'dimensions',
                    {
                      unit: new DynamicEdge(/* parameterizedEdgeArgs */ undefined, 'weightUnit'),
                    }
                  ),
                }
              ),
            }
          ),
        });
      });
    });
  });
});
