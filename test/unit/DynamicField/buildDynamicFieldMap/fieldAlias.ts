import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { buildDynamicFieldMap, DynamicField, VariableArgument } from '../../../../src/DynamicField';
import { fragmentMapForDocument, getOperationOrDie } from '../../../../src/util';

describe(`DynamicField`, () => {
  describe(`buildDynamicFieldMap`, () => {
    function buildEdgeMapForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return buildDynamicFieldMap(fragmentMap, operation.selectionSet);
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
            ID: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'id'),
            FirstName: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'name'),
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
          superUser: new DynamicField(
            /* parameterizedEdgeArgs */ undefined,
            /* fieldName */ 'user',
            {
              ID: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'id'),
              FirstName: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'name'),
            }
          ),
        });
      });

      it(`field alias with parameterized field`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile {
            superUser: user(id: 4) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicField(
            { id: 4 },
            /* fieldName */ 'user',
            {
              ID: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'id'),
              Profile: new DynamicField({ width: 400, height: 200 }, /* fieldName */ 'picture'),
            },
          ),
        });
      });

      it(`field alias with variable parameterized field`, () => {
        const map = buildEdgeMapForOperation(gql`
          query getProfile ($id: ID!) {
            superUser: user(id: $id) {
              ID: id
              Profile: picture(width: 400, height: 200),
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicField(
            { id: new VariableArgument('id') },
            /* fieldName */ 'user',
            {
              ID: new DynamicField(/* parameterizedEdgeArgs */ undefined, /* fieldName */ 'id'),
              Profile: new DynamicField({ width: 400, height: 200 }, /* fieldName */ 'picture'),
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
          shipments: new DynamicField(
            { first: 2 },
            /* fieldName */ undefined,
            {
              shipmentsInfo: new DynamicField(
                /* parameterizedEdgeArgs */ undefined,
                'edges',
                {
                  loads: new DynamicField(
                    /* parameterizedEdgeArgs */ undefined,
                    'contents',
                    {
                      type: new DynamicField(/* parameterizedEdgeArgs */ undefined, 'shipmentItemType'),
                    }
                  ),
                  shipmentSize: new DynamicField(
                    /* parameterizedEdgeArgs */ undefined,
                    'dimensions',
                    {
                      unit: new DynamicField(/* parameterizedEdgeArgs */ undefined, 'weightUnit'),
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
