import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { QueryInfo } from '../../../src/context/QueryInfo';
import { DynamicEdge, VariableArgument } from '../../../src/util';

describe(`context.QueryInfo`, () => {

  describe(`with a valid query document`, () => {

    let query: DocumentNode, info: QueryInfo;
    beforeAll(() => {
      query = gql`
        fragment completeStuff on Stuff {
          id
          name
        }

        query getThings($ids: [ID]!) {
          stuff { ...completeStuff }
          things(ids: $ids) {
            ...completeThing
          }
        }

        fragment completeThing on Thing {
          id
          name
          extra
        }
      `;

      info = new QueryInfo(query);
    });

    it(`hangs onto the document, with no changes`, () => {
      expect(info.document).to.eq(query);
    });

    it(`extracts the operation`, () => {
      expect(info.operation.name!.value).to.eq('getThings');
      expect(info.operation.operation).to.eq('query');
    });

    it(`extracts the operation name`, () => {
      expect(info.operationName).to.eq('getThings');
    });

    it(`builds a fragment map`, () => {
      expect(info.fragmentMap).to.have.all.keys('completeStuff', 'completeThing');
    });

    it(`builds a parameterized edge map`, () => {
      expect(info.dynamicEdgeMap).to.deep.eq({
        things: new DynamicEdge({
          ids: new VariableArgument('ids'),
        }),
      });
    });

  });

});
