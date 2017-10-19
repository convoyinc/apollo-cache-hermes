import { GraphSnapshot } from '../../../../src/GraphSnapshot';
import { extract, restore } from '../../../../src/operations';
import { StaticNodeId } from '../../../../src/schema';
import { createSnapshot } from '../../../helpers';

const { QueryRoot: QueryRootId } = StaticNodeId;

describe.skip(`operations.restore`, () => {
  describe(`duplicate GraphSnapshot`, () => {

    let restoreResult: GraphSnapshot;
    beforeAll(() => {
      const snapshot = createSnapshot(
        {
          foo: [
            { id: 'a', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
          ],
          baz: {
            id: 'a', bar: { id: 1 },
          },
        },
        `{
          foo {
            id
            bar { id }
          }
          baz {
            id
            bar { id }
          }
        }`
      ).snapshot;

      restoreResult = restore(extract(snapshot));
    });

    it(`restores RootQuery GraphSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq({
        inbound: undefined,
        outbound: [
          { id: 'a', path: ['foo', 0] },
          { id: 'a', path: ['foo', 1] },
          { id: 'b', path: ['foo', 2] },
          { id: 'a', path: ['foo', 3] },
          { id: 'b', path: ['foo', 4] },
          { id: 'a', path: ['baz'] },
        ],
        data: {
          foo: [
            { id: 'a', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
            { id: 'a', bar: { id: 1 } },
            { id: 'b', bar: { id: 1 } },
          ],
          baz: {
            id: 'a', bar: { id: 1 },
          },
        },
      });
    });

    it(`restores id=1 GraphSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot(QueryRootId)).to.deep.eq({
        inbound: [
          { id: 'a', path: ['bar'] },
          { id: 'b', path: ['bar'] },
        ],
        outbound: undefined,
        data: { id: 1 },
      });
    });

    it(`restores id=a GraphSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('a')).to.deep.eq({
        inbound: [
          { id: QueryRootId, path: ['foo', 0] },
          { id: QueryRootId, path: ['foo', 1] },
          { id: QueryRootId, path: ['foo', 3] },
          { id: QueryRootId, path: ['baz'] },
        ],
        outbound: [{ id: 1, path: ['bar'] }],
        data: {
          id: 'a',
          bar: { id: 1 },
        },
      });
    });

    it(`restores id=b GraphSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('b')).to.deep.eq({
        inbound: [
          { id: QueryRootId, path: ['foo', 2] },
          { id: QueryRootId, path: ['foo', 4] },
          { id: QueryRootId, path: ['baz'] },
        ],
        outbound: [{ id: 1, path: ['bar'] }],
        data: {
          id: 'b',
          bar: { id: 1 },
        },
      });
    });

    it(`restores id=1 GraphSnapshot from JSON serialization object`, () => {
      expect(restoreResult.getNodeSnapshot('1')).to.deep.eq({
        inbound: [
          { id: 'a', path: ['bar'] },
          { id: 'b', path: ['bar'] },
        ],
        outbound: undefined,
        data: { id: 1 },
      });
    });

  });
});
