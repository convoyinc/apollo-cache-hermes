import * as _ from 'lodash'; // eslint-disable-line import/no-extraneous-dependencies

import { CacheContext } from '../context/CacheContext';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue } from '../primitive';
import { Serializable, NodeId } from '../schema';
import { lazyImmutableDeepSet } from '../util';

/**
 * Create serializable representation of GraphSnapshot.
 *
 * The output still contains 'undefined' value as it is expected that caller
 * will perform JSON.stringify which will strip off 'undefined' value or
 * turn it into 'null' if 'undefined' is in an array.
 *
 * @throws Will throw an error if there is no corresponding node type
 */
export function extract(data: GraphSnapshot, cacheContext: CacheContext): Serializable.GraphSnapshot {
  const result: Serializable.GraphSnapshot = {};
  const entities = data._values;
  // We don't need to check for hasOwnProperty because data._values is
  // created with prototype of 'null'
  for (const id in entities) {
    const entity = entities[id];

    let type: Serializable.NodeSnapshotType;
    if (entity instanceof EntitySnapshot) {
      type = Serializable.NodeSnapshotType.EntitySnapshot;
    } else if (entity instanceof ParameterizedValueSnapshot) {
      type = Serializable.NodeSnapshotType.ParameterizedValueSnapshot;
    } else {
      throw new Error(`${entity.constructor.name} does not have corresponding enum value in Serializable.NodeSnapshotType`);
    }

    const serializedEntity: Serializable.NodeSnapshot = { type };

    if (entity.outbound) {
      serializedEntity.outbound = entity.outbound;
    }

    if (entity.inbound) {
      serializedEntity.inbound = entity.inbound;
    }

    // Extract data value
    const extractedData = extractSerializableData(entity, id);
    if (extractedData !== undefined) {
      if (!Serializable.isSerializable(extractedData)) {
        cacheContext.error(`Data of value ${extractedData} at entityID ${id} is unserializable`);
      }
      serializedEntity.data = extractedData;
    }

    result[id] = serializedEntity;
  }

  return result;
}

function extractSerializableData(entity: NodeSnapshot, id: NodeId): Serializable.StringifyReadyType {
  // If there is no outbound, then data is a value
  if (!entity.outbound || !entity.data) {
    return entity.data;
  }

  // Type annotation is needed otherwise type of entity.data is not nullable
  // and so does extractedData which will cause an error when we assing 'null'.
  let extractedData: JsonValue | null = entity.data;

  // Set all the outbound path (e.g reference) to undefined.
  for (const outbound of entity.outbound) {
    // Only reference to EntitySnapshot is recorded in the data property
    // So we didn't end up set the value to be 'undefined' in the output
    // in every case
    if (graphSnapshot.getNodeSnapshot(outbound.id) instanceof EntitySnapshot) {
      // we have to write out 'null' here to differentiate between
      // data doesn't exist and data is a reference.
      //
      // In the case of parameterized field hanging off of a root
      // the data at the ROOTQUERY node will be undefined with outbound
      // reference to the parameterized node.
      extractedData = lazyImmutableDeepSet(extractedData, entity.data, outbound.path, outbound.path.length === 0 ? null : undefined);
    }
  }

  return extractedData;
}
