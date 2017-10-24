import { CacheContext } from '../context/CacheContext';
import { GraphSnapshot } from '../GraphSnapshot';
import { EntitySnapshot, NodeSnapshot, ParameterizedValueSnapshot } from '../nodes';
import { JsonValue, NestedValue } from '../primitive';
import { Serializable } from '../schema';
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
export function extract(graphSnapshot: GraphSnapshot, cacheContext: CacheContext): Serializable.GraphSnapshot {
  const result: Serializable.GraphSnapshot = {};
  const entities = graphSnapshot._values;
  // We don't need to check for hasOwnProperty because data._values is
  // created with prototype of 'null'
  for (const id in entities) {
    const nodeSnapshot = entities[id];
    const { outbound, inbound } = nodeSnapshot;

    let type: Serializable.NodeSnapshotType;
    if (nodeSnapshot instanceof EntitySnapshot) {
      type = Serializable.NodeSnapshotType.EntitySnapshot;
    } else if (nodeSnapshot instanceof ParameterizedValueSnapshot) {
      type = Serializable.NodeSnapshotType.ParameterizedValueSnapshot;
    } else {
      throw new Error(`${nodeSnapshot.constructor.name} does not have corresponding enum value in Serializable.NodeSnapshotType`);
    }

    const serializedEntity: Serializable.NodeSnapshot = { type };

    if (outbound) {
      serializedEntity.outbound = outbound;
    }

    if (inbound) {
      serializedEntity.inbound = inbound;
    }

    // Extract data value
    const extractedData = extractSerializableData(graphSnapshot, nodeSnapshot);
    if (extractedData !== undefined) {
      if (!Serializable.isSerializable(extractedData, /* allowUndefined */ true)) {
        cacheContext.error(`Data at entityID ${id} is unserializable`);
      }
      serializedEntity.data = extractedData;
    }

    result[id] = serializedEntity;
  }

  return result;
}

function extractSerializableData(graphSnapshot: GraphSnapshot, nodeSnapshot: NodeSnapshot): NestedValue<JsonValue | undefined> {
  // If there is no outbound, then data is a value
  if (!nodeSnapshot.outbound || !nodeSnapshot.data) {
    return nodeSnapshot.data;
  }

  // Type annotation is needed otherwise type of entity.data is not nullable
  // and so does extractedData which will cause an error when we assing 'null'.
  let extractedData: JsonValue | null = nodeSnapshot.data;

  // Set all the outbound path (e.g reference) to undefined.
  for (const outbound of nodeSnapshot.outbound) {
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
      extractedData = lazyImmutableDeepSet(extractedData, nodeSnapshot.data, outbound.path, outbound.path.length === 0 ? null : undefined);
    }
  }

  return extractedData;
}
