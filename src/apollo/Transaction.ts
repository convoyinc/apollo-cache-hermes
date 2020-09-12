import { Cache, Transaction } from '@apollo/client/core';
import lodashIsEqual = require('lodash.isequal');

import { CacheTransaction } from '../CacheTransaction';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonValue, PathPart } from '../primitive';
import { NodeId } from '../schema';
import { deepGet, DocumentNode, verboseTypeof } from '../util';

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
export class ApolloTransaction extends ApolloQueryable<GraphSnapshot> {

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

  updateListOfReferences = this.updateParameterizedReferences;
  /**
   * A helper function to be used when doing EntityUpdate.
   * The method enable users to iterate different parameterized at an editPath
   * of a given container Id.
   *
   * The 'updateFieldCallback' is a callback to compute new value given previous
   * list of references and an object literal of parameterized arguments at the
   * given path.
   *
   * @param containerId {string} an id of a container node to look for editPath.
   * @param pathToParameterizedField {(string|number)[]} an array of paths to
   *    parameterized field in container.
   */
  updateParameterizedReferences(
    containerId: NodeId,
    pathToParameterizedField: PathPart[],
    { writeFragment, writeFragmentName }: { writeFragment: DocumentNode, writeFragmentName?: string },
    { readFragment, readFragmentName }: { readFragment: DocumentNode, readFragmentName?: string },
    updateFieldCallback: (previousList: JsonValue[], fieldArgs?: { [argName: string]: string }) => any
  ) {
    const currentContainerNode = this._queryable.getCurrentNodeSnapshot(containerId);
    if (!currentContainerNode || !currentContainerNode.outbound) {
      return;
    }

    for (const { id: outboundId, path } of currentContainerNode.outbound) {
      if (lodashIsEqual(pathToParameterizedField, path)) {
        const fieldArguments = getOriginalFieldArguments(outboundId);
        if (fieldArguments) {
          let cacheResult: any;
          try {
            cacheResult = this.readFragment(
              {
                id: containerId,
                fragment: readFragment,
                fragmentName: readFragmentName,
                variables: fieldArguments,
              },
              this._queryable.isOptimisticTransaction()
            );
          } catch (error) {
            continue;
          }
          const previousData = deepGet(cacheResult, path);

          // if previousData is not object or null or array,
          // we won't allow the field to be updated
          if (!Array.isArray(previousData) && typeof previousData !== 'object') {
            const details = `${verboseTypeof(previousData)} at ContainerId ${containerId} with readFragment ${readFragmentName}`;
            throw new Error(`updateParameterizedReferences() expects previousData to be an array or object instead got ${details}`);
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
