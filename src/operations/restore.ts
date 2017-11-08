import lodashSet = require('lodash.set');
import lodashFindIndex = require('lodash.findindex');

import { CacheSnapshot } from '../CacheSnapshot';
import { CacheContext } from '../context';
import { GraphSnapshot, NodeSnapshotMap } from '../GraphSnapshot';
import { EntitySnapshot, ParameterizedValueSnapshot } from '../nodes';
import { OptimisticUpdateQueue } from '../OptimisticUpdateQueue';
import { JsonObject, JsonValue, NestedValue, PathPart } from '../primitive';
import { Serializable, NodeId } from '../schema';
import { isNumber, isObject, isScalar } from '../util';

/**
 * Restore GraphSnapshot from serializable representation.
 *
 * The parameter 'serializedState' is likely to be result running JSON.stringify
 * on a result of 'extract' method. This function will directly reference object
 * in the serializedState.
 *
 * @throws Will throw an error if 'type' in serializedState cannot be mapped to
 *    different sub-class of NodeSnapshot.
 * @throws Will throw an error if there is undefined in sparse array
 */
export function restore(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext) {
  const { nodesMap, editedNodeIds } = createGraphSnapshotNodes(serializedState, cacheContext);
  const graphSnapshot = new GraphSnapshot(nodesMap);

  return {
    cacheSnapshot: new CacheSnapshot(graphSnapshot, graphSnapshot, new OptimisticUpdateQueue()),
    editedNodeIds,
  };
}

function createGraphSnapshotNodes(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext) {
  const nodesMap: NodeSnapshotMap = Object.create(null);
  const editedNodeIds = new Set<NodeId>();

  // Create entity nodes in the GraphSnapshot
  for (const nodeId in serializedState) {
    const { type, data, inbound, outbound } = serializedState[nodeId];

    let nodeSnapshot;
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
    editedNodeIds.add(nodeId);
  }

  // Patch data property and reconstruct references
  restoreEntityReferences(nodesMap, cacheContext);

  return { nodesMap, editedNodeIds };
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
      if (referenceNode instanceof EntitySnapshot && data === null) {
        // data is a reference.
        nodesMap[nodeId].data = referenceNode.data;
      } else if (referenceNode instanceof ParameterizedValueSnapshot) {
        // This is specifically to handle a sparse array which happen
        // when each element in the array reference data in a
        // ParameterizedValueSnapshot.
        // (see: parameterizedFields/nestedParameterizedReferenceInArray.ts)
        // We only want to try walking if its data contains an array
        const indexToArrayIndex = lodashFindIndex(path, isNumber);
        if (indexToArrayIndex !== -1) {
          tryRestoreSparseArray(data, path, 0);
        }
      } else if (Array.isArray(data) || isObject(data)) {
        lodashSet(data, path, referenceNode.data);
      }
    }
  }
}

/**
 * Helper function to walk 'data' according to the given path
 * and try to recreate sparse array when encounter 'null' in array along
 * the path.
 *
 * The function assumes that the given data already has the shape of the path
 * For example:
 *    path -> ['one', 0, 'two', 1] will be with
 *    data ->
 *    { one: [
 *        two: [null, <some data>]
 *    ]}
 *
 * This is garunteed to be such a case because when we extract sparse array,
 * we will set 'undefined' as value of an array which will then be
 * JSON.stringify to 'null' and will preserve the structure along the path
 *
 */
function tryRestoreSparseArray(data: NestedValue<JsonValue | undefined>, possibleSparseArrayPaths: PathPart[], idx: number) {
  if (data === undefined) {
    // There should never be 'undefined'
    throw new Error(`Unexpected 'undefined' in the path [${possibleSparseArrayPaths}] at index ${idx}`);
  }

  if (idx >= possibleSparseArrayPaths.length || data === null || isScalar(data)) {
    return;
  }

  const prop = possibleSparseArrayPaths[idx];
  if (Array.isArray(data) && typeof prop === 'number' && data[prop] === null) {
    // truely make it sparse rather than just set "undefined'"
    delete data[prop];
    return;
  }

  tryRestoreSparseArray(data[prop], possibleSparseArrayPaths, idx+1);
}
