import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import gql from 'graphql-tag';

import { CacheContext } from '../../../src/context';
import { QueryInfo } from '../../../src/context/QueryInfo';
import { strictConfig } from '../../helpers';

describe(`context.QueryInfo`, () => {

  const context = new CacheContext(strictConfig);

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

      info = new QueryInfo(context, query);
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

    it(`collects the variables that are used`, () => {
      expect(info.variables).to.deep.eq(new Set(['ids']));
    });

  });

  describe(`with variable defaults`, () => {

    let query: DocumentNode, info: QueryInfo;
    beforeAll(() => {
      query = gql`
        mutation makeCheesy($ids: [ID]!, $name: String = "Munster", $stinky: Boolean) {
          updateCheesiness(ids: $ids, name: $name, stinky: $stinky)
        }
      `;

      info = new QueryInfo(context, query);
    });

    it(`collects the variables that are used`, () => {
      expect(info.variables).to.deep.eq(new Set(['ids', 'name', 'stinky']));
    });

    it(`collects default values for operation parameters`, () => {
      expect(info.variableDefaults['name']).to.eq('Munster');
    });

    it(`includes optional arguments as having a default value of null`, () => {
      expect(info.variableDefaults['stinky']).to.eq(null);
    });

    it(`excludes required parameters from the defaults`, () => {
      expect(info.variableDefaults).to.not.have.key('ids');
    });

  });

  describe(`validation`, () => {

    it(`asserts that all variables are declared`, () => {
      expect(() => {
        new QueryInfo(context, gql`
          query whoops($foo: Number) {
            thing(foo: $foo, bar: $bar, baz: $baz)
          }
        `);
      }).to.throw(/\$bar(.|\n)*\$baz/);
    });

    it(`asserts that all variables are declared, when used via fragments`, () => {
      expect(() => {
        new QueryInfo(context, gql`
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
        new QueryInfo(context, gql`
          query whoops($foo: Number, $bar: String, $baz: ID) {
            thing(bar: $bar)
          }
        `);
      }).to.throw(/\$foo(.|\n)*\$baz/);
    });

    it(`asserts that all variables are used, including fragments`, () => {
      expect(() => {
        new QueryInfo(context, gql`
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
