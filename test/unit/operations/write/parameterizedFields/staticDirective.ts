import { CacheContext } from '../../../../../src/context';
import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { write } from '../../../../../src/operations/write';
import { StaticNodeId } from '../../../../../src/schema';
import { query, strictConfig } from '../../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe(`operations.write`, () => {

  const context = new CacheContext(strictConfig);
  const empty = new GraphSnapshot();

  describe(`with @static`, () => {

    describe(`with @static fields`, () => {

      const staticQuery = query(`{
        todos {
          id
          value: rawValue @static
          history(limit: 2) @static {
            changeType
            value
          }
        }
      }`);

      let snapshot: GraphSnapshot;
      beforeAll(() => {
        snapshot = write(context, empty, staticQuery, {
          todos: [
            {
              id: 1,
              value: 'hello',
              history: [
                {
                  changeType: 'edit',
                  value: 'ohai',
                },
                {
                  changeType: 'edit',
                  value: 'hey',
                },
              ],
            },
          ],
        }).snapshot;
      });

      it(`writes static fields to the containing entity`, () => {
        jestExpect(snapshot.getNodeData('1')).toEqual({
          id: 1,
          value: 'hello',
          history: [
            {
              changeType: 'edit',
              value: 'ohai',
            },
            {
              changeType: 'edit',
              value: 'hey',
            },
          ],
        });
      });

      it(`does not create parameterized field nodes`, () => {
        jestExpect(snapshot.allNodeIds().sort()).toEqual([QueryRootId, '1'].sort());
      });

    });

  });

});
