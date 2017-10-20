import * as _ from 'lodash'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue } from '../primitive';
import { Serializable, NodeId } from '../schema';
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

    const serializedData = createDataWithoutReferences(entity, id);
    if (serializedData) {
      serializedEntity.data = serializedData;
    }

    result[id] = serializedEntity;
  }

  return result;
}

interface OutboundTree {
  [key: string]: OutboundTree | never[] | [OutboundTree] | null;
}

function createDataWithoutReferences(entity: NodeSnapshot, id: NodeId): JsonValue | undefined {
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
    if (!Serializable.isSerializable(entity.data)) {
      throw new Error(`Data at entityID ${id} is unserializable`);
    }
    return entity.data;
  }

  let outboundTree: OutboundTree | [OutboundTree] | undefined;
  let currentTreeNode: OutboundTree | [OutboundTree];

  for (const outboundRef of entity.outbound) {
    const outboundPath = outboundRef.path;
    if (outboundPath.length > 0) {
      // entity.data can be array if
      // the entity is ParameterizedValueNodeSnapshot
      outboundTree = outboundTree
        ? outboundTree
        : entity.data instanceof Array ? [] : Object.create(null);
      currentTreeNode = outboundTree!;
    } else {
      // We probably should check that when
      // outboundPath.length === 0 -> there is only one outboundRef
      break;
    }

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

  // There is no outboundTree so the entire data is just a reference
  // see: topLevelParameterizedReference
  return outboundTree ? getValuesFromDataProperty(entity.data, outboundTree) : undefined;
}

// TODO (yuisu): Handle top-level data is an array outside
function getValuesFromDataProperty(data: JsonValue, outboundTree: OutboundTree | [OutboundTree]): JsonValue {
  if (isScalar(data)) {
    return data;
  }

  // ParameterizedValueNodeSnapshot can have array as top-level data value.
  if (data instanceof Array) {
    // For array outboundTree should only need to store
    // one node per an entire array.
    const result = new Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      const element = data[i];
      result[i] = element
        ? getValuesFromDataProperty(element, outboundTree[0])
        : null;
    }
    return result;
  }

  // Data is an object type
  const output = {};
  for (const dataName of Object.getOwnPropertyNames(data)) {
    const outboundTreeNode = (outboundTree as OutboundTree)[dataName];
    // Doesn't exist in outboundTree, it is a value
    if (outboundTreeNode === undefined) {
      if (!Serializable.isSerializable(data[dataName])) {
        throw new Error(`Value at ${dataName} is unserializable`);
      }
      output[dataName] = data[dataName];
    } else if (outboundTreeNode === null) {
      continue;
    } else if (_.isArray(outboundTreeNode)) {
      output[dataName] = outboundTreeNode.length === 0
        ? [] : getValuesFromDataProperty(data[dataName], outboundTreeNode as [OutboundTree]);
    } else if (_.isPlainObject(outboundTreeNode)) {
      // exist in outboundTree as an object then
      // one of its children is a reference so walk it
      output[dataName] = getValuesFromDataProperty(data[dataName], outboundTreeNode);
    }
  }
  return output;
}
