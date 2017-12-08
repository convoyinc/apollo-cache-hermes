import { ApolloCache, Cache, Transaction } from 'apollo-cache';
import { StoreValue } from 'apollo-utilities';
import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies
import lodashIsEqual = require('lodash.isequal');

import { CacheTransaction } from '../CacheTransaction';
import { GraphSnapshot } from '../GraphSnapshot';
import { PathPart } from '../primitive';
import { NodeId } from '../schema';

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

  removeOptimistic(id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`removeOptimistic() is not allowed within a transaction`);
  }

  performTransaction(transaction: Transaction<GraphSnapshot>): void {
    transaction(this);
  }

  recordOptimisticTransaction(transaction: Transaction<GraphSnapshot>, id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(query: Cache.WatchOptions): () => void { // eslint-disable-line class-methods-use-this
    throw new Error(`watch() is not allowed within a transaction`);
  }

  restore(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`restore() is not allowed within a transaction`);
  }

  extract(): any { // eslint-disable-line class-methods-use-this
    throw new Error(`extract() is not allowed within a transaction`);
  }

  /**
   * 
   */
  updateFieldInstances(
    containerId: NodeId,
    editPath: PathPart[],
    { fragment, fragmentName }: {fragment: DocumentNode, fragmentName: string},
    updateFieldCallback: (previousValues: StoreValue | undefined, fieldArgs: { [argName: string]: string }) => any
  ) {
    const currentNode = this._queryable.getCurrentNodeSnapshot(containerId);
    if (!currentNode || !currentNode.outbound) {
      // TODO (yuisu): error handling
      return;
    }

    for (const { id: outboundId, path } of currentNode.outbound) {
      if (lodashIsEqual(editPath, path)) {
        const prevValue = this._queryable.getPreviousNodeSnapshot(outboundId);
        const fieldArguments = getOriginalFieldArguments(outboundId);
        if (fieldArguments) {
          const newValue = updateFieldCallback(prevValue && prevValue.data, fieldArguments);
          // TODO(yuisu): determine if we should call writeFragment
          this.writeFragment({
            id: outboundId,
            fragment,
            fragmentName,
            data: newValue,
          });
        }
      }
    }
    // const previousValues = _.get(parentNodeSnapshot.data, paths);
    // const parentId = _.get(parentNodeSnapshot.data, 'id');

    // for (const fieldArg of fieldArgs) {
    //   const newValues = updateFieldCallback(previousValues, fieldArg);
    //   if (newValues === previousValues) continue;
      
    //   this._writeFragment({
    //     id: parentId,
    //     data: _.set({}, paths, newValues),
    //     parsedQuery: makeNestedParsedQuery(paths, parseQuery(fragment))
    //   });
  
    // }


    // const parsedFullShipment = parsequery(fragment);
    // new ParsedQueryNode({
    //   children: {
    //     shipments: parsedFullShipment,
    //   }
    // })


    // this.writeFragment({
    //   id: parentId,
    //   data: _.set({}, paths, newValues),
    //   ...fragmentInfo,
    // });
  }

}
