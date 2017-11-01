import lodashSet = require('lodash.set');
import lodashFindIndex = require('lodash.findindex');

import { CacheContext } from '../context';
import { GraphSnapshot, NodeSnapshotMap } from '../GraphSnapshot';
import { NodeSnapshot, EntitySnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonObject, JsonValue } from '../primitive';
import { Serializable } from '../schema';
import { isNumber, isObject } from '../util';

/**
 * Restore GraphSnapshot from serializable representation.
 *
 * The parameter 'serializedState' is likely to be result running JSON.stringify
 * on a result of 'extract' method. This function will directly reference object
 * in the serializedState.
 *
 * @throws Will throw an error if 'type' in serializedState cannot be mapped to
 *    different sub-class of NodeSnapshot.
 */
export function restore(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext): GraphSnapshot {
  const _values = createGraphSnapshotNodes(serializedState, cacheContext);
  return new GraphSnapshot(_values);
}

function createGraphSnapshotNodes(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext): NodeSnapshotMap {
  const nodesMap: NodeSnapshotMap = Object.create(null);

  // Create entity nodes in the GraphSnapshot
  for (const nodeId in serializedState) {
    const { type, data, inbound, outbound } = serializedState[nodeId];

    let nodeSnapshot: NodeSnapshot | undefined;
    switch (type) {
      case Serializable.NodeSnapshotType.EntitySnapshot:
        nodeSnapshot = new EntitySnapshot(data as JsonObject, inbound, outbound);
        break;
      case Serializable.NodeSnapshotType.ParameterizedValueSnapshot:
        nodeSnapshot = new ParameterizedValueSnapshot(data as JsonValue, inbound, outbound);
        break;
      default:
        throw new Error(`Invalid Serializable.NodeSnapshotType ${type} at ${nodeId}`);
    }

    nodesMap[nodeId] = nodeSnapshot!;
  }

  // Patch data property and reconstruct references
  restoreEntityReferences(nodesMap, cacheContext);

  return nodesMap;
}

function restoreEntityReferences(nodesMap: NodeSnapshotMap, cacheContext: CacheContext) {
  const { entityTransformer, entityIdForValue } = cacheContext;

  for (const nodeId in nodesMap) {

    const { data, outbound } = nodesMap[nodeId];
    if (entityTransformer && isObject(data) && entityIdForValue(data)) {
      entityTransformer(data);
    }

    // If it doesn't have outbound then 'data' doesn't have any references
    // If it is 'undefined' means that there is no data value
    // in both cases, there is no need for modification.
    if (!outbound || data === undefined) {
      continue;
    }

    for (const { id: referenceId, path } of outbound) {
      const referenceNode = nodesMap[referenceId];
      if (data === null) {
        // data itsels is a reference.
        nodesMap[nodeId].data = referenceNode.data;
      } else if (referenceNode instanceof ParameterizedValueSnapshot) {
        // This is specifically to handle a sparse array which happen
        // when each element in the array reference data in a
        // ParameterizedValueSnapshot.
        // (see: parameterizedFields/nestedParameterizedReferenceInArray.ts)
        // When we do extraction of sparse array, we will represent
        // each hole in the array as null.
        // We will remove null to re-create a sparse array.
        const indexToArrayIndex = lodashFindIndex(path, isNumber);
        if (indexToArrayIndex !== -1) {
          // Get the reference to an array
          const pathToSetValue = path.slice(0, indexToArrayIndex + 1);

          lodashSet(data as object, pathToSetValue, undefined);
        }
      } else if (Array.isArray(data) || isObject(data)) {
        lodashSet(data, path, referenceNode.data);
      }
    }
  }
}
