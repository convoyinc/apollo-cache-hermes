import * as _ from 'lodash'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { CacheContext } from '../context/CacheContext';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue } from '../primitive';
import { Serializable, NodeId } from '../schema';
import { isScalar } from '../util';

export function extract(data: GraphSnapshot, cacheContext?: CacheContext): Serializable.GraphSnapshot {
  /* Loop through values of data
   *  check instanceof NodeSnapshot -> set 'type'
   *  outbound is not undefined -> copy over
   *  inbound is not undefined -> copy over
   *  data check-if-property-is-ref, if not -> copy
   */

  const result: Serializable.GraphSnapshot = {};
  const entities = data._values;
  // We don't need to check for hasOwnProperty because
  // _values are created with prototype null
  for (const id in entities) {
    const entity = entities[id];

    let type: Serializable.NodeSnapshotType;
    if (entity instanceof EntitySnapshot) {
      type = Serializable.NodeSnapshotType.EntitySnapshot;
    } else if (entity instanceof ParameterizedValueSnapshot) {
      type = Serializable.NodeSnapshotType.ParameterizedValueSnapshot;
    } else {
      throw new Error('All types of NodeSnapshot should have corresponding enum value in Serializable.NodeSnapshotType');
    }
    const serializedEntity: Serializable.NodeSnapshot = { type };

    if (entity.outbound) {
      serializedEntity.outbound = entity.outbound;
    }

    if (entity.inbound) {
      serializedEntity.inbound = entity.inbound;
    }

    const serializedData = createSerializableData(entity, id, cacheContext);
    if (serializedData) {
      serializedEntity.data = serializedData;
    }

    result[id] = serializedEntity;
  }

  return result;
}

/**
 * Constructed tree from walking outbound references path.
 * We use this tructure to help determine whether value at
 * particular property is a reference of not.
 *
 * - outboundTree value : null -> that property is a reference
 *   don't output in the serializable data
 * - outboundTree value : undefined -> that property is a value
 *   output in the serializable data
 * - outboundTree value : an object -> children contains references
 *   recursively walk
 * - outboundTree value : an array of size 1 -> property is an array
 *   use the first element and recursively walk for each element.
 *   for an array, we garuntee that all elements have the same structure
 *   that is why we only store one element.
 *
 * Examples of the outboundTree and corresponding data
 *
 * 1)
 * OutboundTree -> {
 *  one: {
 *    two: {
 *      three: null,
 *    },
 *  },
 * }
 *
 * data -> {
 *  one: {
 *    two: {
 *      three: { id : 1 },
 *    }
 *    four: '4',
 *  },
 * }
 *
 * outputData -> {
 *  one: {
 *    two: { },
 *    four: '4'
 *  }
 * }
 *
 * 2)
 * OutboundTree -> {
 *  one: {
 *    two: [
 *      { three: null }
 *    ],
 *  },
 * }
 *
 * data -> {
 *  one: {
 *    two: [
 *      { three: { id : 1 } },
 *      { three: { id : 2 } },
 *    ],
 *    four: '4',
 *  },
 * }
 *
 * outputData -> {
 *  one: {
 *    two: [{} , {}]
 *    four: '4',
 *  },
 * }
 *
 * 3)
 * OutboundTree -> {
 *  one: {
 *    two: [
 *      { three: null }
 *    ],
 *  },
 * }
 *
 * data -> {
 *  one: {
 *    two: [
 *      { id : 1 },
 *      { id : 2 },
 *    ]
 *    four: '4',
 *  },
 * }
 *
 * outputData -> {
 *  one: {
 *    two: []
 *    four: '4',
 *  },
 * }
 *
 */
interface OutboundTree {
  [key: string]: OutboundTree | never[] | [OutboundTree] | null;
}

function createSerializableData(entity: NodeSnapshot, id: NodeId, cacheContext?: CacheContext): JsonValue | undefined {
  /*
   * - data === undefined -> the entire data is a reference
   *   like those of ParameterizedValueSnapshot.
   * - No outbound -> data as it must be a value
   * - data is not undefined and outbound is not empty:
   *  Walk each outbound reference:
   *    path === [] -> the entire data is a references, return undefined
   *    path is not empty -> build an outboundTree
   *  Walk data object for each property.
   *    Check if at each property exist in outboundTree
   *      not exist -> that property is a value so copy
   *      exist as null -> that property is a reference, then null
   *      an object -> one of child contains a reference, recursively
   *      an array -> recursively apply on each element
   */

  // if data is undefined then the entire data is a reference
  // if there is no outbound references then data is just values so return that.
  // if data is not an object or array just return it out.
  if (entity.data === undefined || !entity.outbound || isScalar(entity.data)) {
    // TODO (yuisu): should this we copy if it is an object
    //  or just return the existed value
    reportUnSerializableError(entity.data);
    return entity.data;
  }

  let topLevelOutboundTree: OutboundTree | [OutboundTree] | undefined;
  let currentTreeNode: OutboundTree | [OutboundTree];

  for (const outboundRef of entity.outbound) {
    const outboundPath = outboundRef.path;
    if (outboundPath.length > 0) {
      // entity.data can be array if
      // the entity is ParameterizedValueNodeSnapshot
      topLevelOutboundTree = topLevelOutboundTree
        ? topLevelOutboundTree
        : entity.data instanceof Array ? [] : Object.create(null);
      currentTreeNode = topLevelOutboundTree!;
    } else {
      // We probably should check that when
      // outboundPath.length === 0 -> there is only one outboundRef
      // path === [] -> the entire data is a references
      // stop right here.
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
  return topLevelOutboundTree ? getOnlyValuesFromData(entity.data, topLevelOutboundTree) : undefined;

  function getOnlyValuesFromData(data: JsonValue, outboundTree: OutboundTree | [OutboundTree]): JsonValue {
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
          ? getOnlyValuesFromData(element, outboundTree[0])
          : null;  // null is a place holder in case of a sparse array
      }
      return result;
    }

    // Data is an object type
    const output = {};
    for (const dataName of Object.getOwnPropertyNames(data)) {
      const outboundTreeNode = (outboundTree as OutboundTree)[dataName];
      // Doesn't exist in outboundTree, it is a value
      if (outboundTreeNode === undefined) {
        reportUnSerializableError(data[dataName]);
        output[dataName] = data[dataName];
      } else if (outboundTreeNode === null) {
        continue;
      } else if (_.isArray(outboundTreeNode)) {
        output[dataName] = outboundTreeNode.length === 0
          ? [] : getOnlyValuesFromData(data[dataName], outboundTreeNode as [OutboundTree]);
      } else if (_.isPlainObject(outboundTreeNode)) {
        // exist in outboundTree as an object then
        // one of its children is a reference so walk it
        output[dataName] = getOnlyValuesFromData(data[dataName], outboundTreeNode);
      }
    }
    return output;
  }

  function reportUnSerializableError(value: any) {
    if (!Serializable.isSerializable(value)) {
      if (cacheContext) {
        cacheContext.debug(`Data of value ${value} at entityID ${id} is unserializable`);
      } else {
        throw new Error(`Data of value ${value} at entityID ${id} is unserializable`);
      }
    }
  }
}
