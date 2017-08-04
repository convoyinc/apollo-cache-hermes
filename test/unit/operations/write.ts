import gql from 'graphql-tag';

import { Configuration } from '../../../src/Configuration';
import { GraphSnapshot } from '../../../src/GraphSnapshot';
import { write } from '../../../src/operations/write';
import { StaticNodeId } from '../../../src/schema';

// These are really more like integration tests, given the underlying machinery.
describe(`operations.write`, () => {

  const config: Configuration = {
    entityIdForNode: (node: any) => node && node.id,
  };

  const viewerQuery = gql`{
    viewer {
      id
      name
    }
  }`;

  const empty = new GraphSnapshot();

  describe(`end-to-end`, () => {

    describe(`when writing a single root entity`, () => {

      const { snapshot, editedNodeIds } = write(config, empty, viewerQuery, {
        viewer: { id: 123, name: 'Gouda' },
      });

      it(`creates the query root, referencing the entity`, () => {
        expect(snapshot.get(StaticNodeId.QueryRoot)).to.deep.eq({
          viewer: { id: 123, name: 'Gouda' },
        });
      });

      it(`indexes the entity`, () => {
        expect(snapshot.get('123')).to.deep.eq({
          id: 123, name: 'Gouda',
        });
      });

      it(`directly references viewer from the query root`, () => {
        const queryRoot = snapshot.get(StaticNodeId.QueryRoot);
        const viewer = snapshot.get('123');
        expect(queryRoot.viewer).to.eq(viewer);
      });

      it(`marks the entity as edited`, () => {
        expect(editedNodeIds).to.have.members(['123']);
      });

    });

  });

});
