import { ApolloCache, Cache, Transaction } from 'apollo-cache';
import { JsonValue } from 'apollo-utilities';
import lodashIsEqual = require('lodash.isequal');
import lodasGet = require('lodash.get');

import { CacheTransaction } from '../CacheTransaction';
import { GraphSnapshot } from '../GraphSnapshot';
import { PathPart } from '../primitive';
import { NodeId } from '../schema';
import { DocumentNode } from '../util';

import { ApolloQueryable } from './Queryable';

function getOriginalFieldArguments(id: NodeId): { [argName: string]: string } | undefined {
  // Split `${containerId}❖${JSON.stringify(path)}❖${JSON.stringify(args)}`
  const idComponents = id.split('❖');
  if (idComponents.length < 3) {
    return undefined;
  }
  return JSON.parse(idComponents[2]);
}

/**
 * Apollo-specific transaction interface.
 */
export class ApolloTransaction extends ApolloQueryable implements ApolloCache<GraphSnapshot> {

  constructor(
    /** The underlying transaction. */
    protected _queryable: CacheTransaction,
  ) {
    super();
  }

  reset(): Promise<void> { // eslint-disable-line class-methods-use-this
    throw new Error(`reset() is not allowed within a transaction`);
  }

  removeOptimistic(_id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`removeOptimistic() is not allowed within a transaction`);
  }

  performTransaction(transaction: Transaction<GraphSnapshot>): void {
    transaction(this);
  }

  recordOptimisticTransaction(_transaction: Transaction<GraphSnapshot>, _id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(_query: Cache.WatchOptions): () => void { // eslint-disable-line class-methods-use-this
    throw new Error(`watch() is not allowed within a transaction`);
  }

  restore(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`restore() is not allowed within a transaction`);
  }

  extract(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`extract() is not allowed within a transaction`);
  }

  /**
   * A helper function to be used when doing EntityUpdate.
   * The method enable users to interate different parameterized at an editPath
   * of a given container Id.
   *
   * The 'updateFieldCallback' is a callback to compute new value given previous
   * list of references and an object literal of parameterized arguments at the
   * given path.
   */
  updateListOfReferences(
    containerId: NodeId,
    editPath: PathPart[],
    { writeFragment, writeFragmentName }: { writeFragment: DocumentNode, writeFragmentName?: string },
    { readFragment, readFragmentName }: { readFragment: DocumentNode, readFragmentName?: string },
    updateFieldCallback: (previousList: JsonValue[], fieldArgs: { [argName: string]: string }) => any
  ) {
    const currentContainerNode = this._queryable.getCurrentNodeSnapshot(containerId);
    if (!currentContainerNode || !currentContainerNode.outbound) {
      return;
    }

    for (const { id: outboundId, path } of currentContainerNode.outbound) {
      if (lodashIsEqual(editPath, path)) {
        const fieldArguments = getOriginalFieldArguments(outboundId);
        if (fieldArguments) {
          const cacheResult = this.readFragment(
            {
              id: containerId,
              fragment: readFragment,
              fragmentName: readFragmentName,
              variables: fieldArguments,
            },
            this._queryable.isOptimisticTransaction()
          );
          const previousData = lodasGet(cacheResult, path);

          if (!Array.isArray(previousData)) {
            throw new Error(`updateListOfReferences() expects previousData to be an array.`);
          }

          const updateData = updateFieldCallback(previousData, fieldArguments);
          if (updateData !== previousData) {
            this.writeFragment({
              id: outboundId,
              fragment: writeFragment,
              fragmentName: writeFragmentName,
              variables: fieldArguments,
              data: updateData,
            });
          }
        }
      }
    }
  }

}
