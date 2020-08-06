import { getFragmentQueryDocument } from '@apollo/client/utilities';

import { JsonObject } from '../primitive';
import { NodeId, RawOperation, StaticNodeId } from '../schema';
import { DocumentNode } from '../util';

/**
 * Builds a query.
 */
export function buildRawOperationFromQuery(document: DocumentNode, variables?: JsonObject, rootId?: NodeId): RawOperation {
  return {
    rootId: rootId || StaticNodeId.QueryRoot,
    document,
    variables,
  };
}

export function buildRawOperationFromFragment(
  fragmentDocument: DocumentNode,
  rootId: NodeId,
  variables?: JsonObject,
  fragmentName?: string
): RawOperation {
  return {
    rootId,
    document: getFragmentQueryDocument(fragmentDocument, fragmentName),
    variables,
    fragmentName,
    fromFragmentDocument: true,
  };
}
