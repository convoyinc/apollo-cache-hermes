import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { QueryInfo } from '../../../src/context/QueryInfo';
import { DynamicField, VariableArgument } from '../../../src/DynamicField';

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

    it(`builds a parameterized field map`, () => {
      expect(info.dynamicFieldMap).to.deep.eq({
        things: new DynamicField({
          ids: new VariableArgument('ids'),
        }),
      });
    });

  });

  describe(`validation`, () => {

    it(`asserts that all variables are declared`, () => {
      expect(() => {
        new QueryInfo(gql`
          query whoops($foo: Number) {
            thing(foo: $foo, bar: $bar, baz: $baz)
          }
        `);
      }).to.throw(/\$bar(.|\n)*\$baz/);
    });

    it(`asserts that all variables are declared, when used via fragments`, () => {
      expect(() => {
        new QueryInfo(gql`
          query whoops($foo: Number) {
            thing { ...stuff }
          }

          fragment stuff on Thing {
            stuff(foo: $foo, bar: $bar, baz: $baz)
          }
        `);
      }).to.throw(/\$bar(.|\n)*\$baz/);
    });

    it(`asserts that all variables are used`, () => {
      expect(() => {
        new QueryInfo(gql`
          query whoops($foo: Number, $bar: String, $baz: ID) {
            thing(bar: $bar)
          }
        `);
      }).to.throw(/\$foo(.|\n)*\$baz/);
    });

    it(`asserts that all variables are used, including fragments`, () => {
      expect(() => {
        new QueryInfo(gql`
          query whoops($foo: Number, $bar: String, $baz: ID) {
            thing { ...stuff }
          }

          fragment stuff on Thing {
            thing(bar: $bar)
          }
        `);
      }).to.throw(/\$foo(.|\n)*\$baz/);
    });

  });

});
