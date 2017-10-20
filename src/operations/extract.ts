import * as _ from 'lodash'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue, JsonObject } from '../primitive';
import { Serializable } from '../schema';
import { isScalar } from '../util';

export function extract(data: GraphSnapshot): Serializable.GraphSnapshot {
  /* Loop through values of data
   *  if it is ParameterizedValueSnapshot
   *    type = ParameterizedValuesSnapshot
   *  else type = EntitySnapshot
   *  outbound is not undefined -> copy over
   *  inbound is not undefined -> copy over
   *  data check-if-property-is-ref, if not -> copy
   */

  const result: Serializable.GraphSnapshot = {};
  const entities = data._values;
  // We don't need to check if for hasOwnProperty because
  // _vlaues are created with prototype null
  for (const id in entities) {
    const entity = entities[id];

    let type: Serializable.NodeSnapshotType;
    if (entity instanceof EntitySnapshot) {
      type = Serializable.NodeSnapshotType.EntitySnapshot;
    } else if (entity instanceof ParameterizedValueSnapshot) {
      type =Serializable.NodeSnapshotType.ParameterizedValueSnapshot;
    } else {
      throw new Error('All types of NodeSnapshot should have an enum value in Serializable.NodeSnapshotType');
    }
    const serializedEntity: Serializable.NodeSnapshot = { type };

    if (entity.outbound) {
      serializedEntity.outbound = entity.outbound;
    }

    if (entity.inbound) {
      serializedEntity.inbound = entity.inbound;
    }

    const serializedData = createDataWithoutReferences(entity);
    if (serializedData) {
      serializedEntity.data = serializedData;
    }

    result[id] = serializedEntity;
  }

  return result;
}

interface OutboundTree {
  [key: string]: OutboundTree | OutboundTree[] | null;
}

function createDataWithoutReferences(entity: NodeSnapshot): JsonValue | undefined {
  /*
   * - data === undefined -> the entire data is a reference
   * No outbound then just return the data as it must be a value
   * - data is not undefined outbound is not empty:
   *  Walk each outbound reference:
   *    path === [] -> the entire data is a references, return undefined
   *    path is not empty -> build an outboundTree
   *  Walk data object for each property.
   *    Check if at each property exist in outboundTree
   *      not exist -> value so just copy
   *      exist as null -> that property is a reference, then null
   *      an object -> one of child contains a reference, continue
   */

  // if data is undefined then the entire data is a reference
  // if there is no outbound references then data is just values so return that.
  // if data is not an object or array just return it out.
  if (entity.data === undefined || !entity.outbound || isScalar(entity.data)) {
    // TODO (yuisu): should this we copy if it is an object
    //  or just return the existed value
    return entity.data;
  }

  const outboundTree: OutboundTree = Object.create(null);

  let currentTreeNode: OutboundTree | [OutboundTree];
  for (const outboundRef of entity.outbound) {
    const outboundPath = outboundRef.path;
    currentTreeNode = outboundTree;

    for (let i = 0; i < outboundPath.length; ++i) {
      const currentPath = outboundPath[i];
      if (_.isArray(currentTreeNode)) {
        // If the currentPath is an number then there should already be an array
        // Only create an tree node if we still have more paths to explore
        if (currentTreeNode.length === 0 && outboundPath[i+1] !== undefined) {
          currentTreeNode.push({});
        }
        currentTreeNode = currentTreeNode[0];
      } else {
        if (currentTreeNode[currentPath] === undefined) {
          // End of the array path
          if (outboundPath[i+1] === undefined) {
            currentTreeNode[currentPath] = null;
          } else if (typeof outboundPath[i+1] === 'number') {
            currentTreeNode[currentPath] = [];
          } else {
            currentTreeNode[currentPath] = {};
          }
        }
        currentTreeNode = currentTreeNode[currentPath] as OutboundTree;
      }
    }
  }

  return getValuesFromData(entity.data, outboundTree);
}

// TODO (yuisu): Handle top-level data is an array outside
function getValuesFromData(data: JsonValue, outboundTree: OutboundTree): JsonValue {
  if (isScalar(data)) {
    return data;
  }

  // ParameterizedValueNodeSnapshot can have array as top-level data value.
  if (data instanceof Array) {
    // We can safely cast to JsonObject because if it is just a scalar value,
    // we will just copy out already.
    return data.map((element) => {
      return getValuesFromData(element, outboundTree);
    });
  }

  // data is an object type
  const output = {};
  for (const dataName of Object.getOwnPropertyNames(data)) {
    const outboundTreeNode = outboundTree[dataName];
    // Doesn't exist in outboundTree, it is a value
    if (outboundTreeNode === undefined) {
      output[dataName] = data[dataName];
    } else if (outboundTreeNode === null) {
      continue;
    } else if (_.isArray(outboundTreeNode)) {
      output[dataName] = outboundTreeNode.length === 0
        ? [] : getValuesFromData(data[dataName], outboundTreeNode[0]);
    } else if (_.isPlainObject(outboundTreeNode)) {
      // exist in outboundTree as an object then
      // one of its children is a reference so walk it
      output[dataName] = getValuesFromData(data[dataName], outboundTreeNode);
    }
  }
  return output;
}
