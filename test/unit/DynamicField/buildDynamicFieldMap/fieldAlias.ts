import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { buildDynamicFieldMap, DynamicField, VariableArgument } from '../../../../src/DynamicField';
import { fragmentMapForDocument, getOperationOrDie } from '../../../../src/util';

describe(`DynamicField`, () => {
  describe(`buildDynamicFieldMap`, () => {
    function buildFieldMapForOperation(document: DocumentNode) {
      const operation = getOperationOrDie(document);
      const fragmentMap = fragmentMapForDocument(document);
      return buildDynamicFieldMap(fragmentMap, operation.selectionSet);
    }

    describe(`with field alias`, () => {

      it(`simple query`, () => {
        const map = buildFieldMapForOperation(gql`{
            user {
              ID: id,
              FirstName: name,
            },
          }
        `);
        expect(map).to.deep.eq({
          user: {
            ID: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'id'),
            FirstName: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'name'),
          },
        });
      });

      it(`nested alias`, () => {
        const map = buildFieldMapForOperation(gql`
          query getUser {
            superUser: user {
              ID: id
              FirstName: name
            }
          }
        `);
        expect(map).to.deep.eq({
          superUser: new DynamicField(
            /* fieldArgs */ undefined,
            /* fieldName */ 'user',
            {
              ID: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'id'),
              FirstName: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'name'),
            }
          ),
        });
      });

      it(`field alias with parameterized field`, () => {
        const map = buildFieldMapForOperation(gql`
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
              ID: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'id'),
              Profile: new DynamicField({ width: 400, height: 200 }, /* fieldName */ 'picture'),
            },
          ),
        });
      });

      it(`field alias with variable parameterized field`, () => {
        const map = buildFieldMapForOperation(gql`
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
              ID: new DynamicField(/* fieldArgs */ undefined, /* fieldName */ 'id'),
              Profile: new DynamicField({ width: 400, height: 200 }, /* fieldName */ 'picture'),
            },
          ),
        });
      });

      it(`complex nested alias`, () => {
        const map = buildFieldMapForOperation(gql`{
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

        expect(map).to.deep.eq({
          shipments: new DynamicField(
            { first: 2 },
            /* fieldName */ undefined,
            {
              shipmentsInfo: new DynamicField(
                /* fieldArgs */ undefined,
                'fields',
                {
                  loads: new DynamicField(
                    /* fieldArgs */ undefined,
                    'contents',
                    {
                      type: new DynamicField(/* fieldArgs */ undefined, 'shipmentItemType'),
                    }
                  ),
                  shipmentSize: new DynamicField(
                    /* fieldArgs */ undefined,
                    'dimensions',
                    {
                      unit: new DynamicField(/* fieldArgs */ undefined, 'weightUnit'),
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
