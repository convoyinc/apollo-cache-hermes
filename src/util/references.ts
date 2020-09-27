import isEqual from '@wry/equality';

import { NodeReference, NodeSnapshot } from '../nodes';
import { PathPart } from '../primitive';
import { NodeId } from '../schema';

export type ReferenceDirection = 'inbound' | 'outbound';

/**
 * Mutates a snapshot, removing an inbound reference from it.
 *
 * Returns whether all references were removed.
 */
export function removeNodeReference(
  direction: ReferenceDirection,
  snapshot: NodeSnapshot,
  id: NodeId,
  path: PathPart[],
): boolean {
  const references = snapshot[direction];
  if (!references) return true;

  if (!hasNodeReference(snapshot, direction, id, path)) {
    return false;
  }

  references.delete(id);
  return !references.size;
}

/**
 * Mutates a snapshot, adding a new reference to it.
 */
export function addNodeReference(
  direction: ReferenceDirection,
  snapshot: NodeSnapshot,
  id: NodeId,
  path: PathPart[],
): boolean {
  if (!snapshot[direction]) {
    snapshot[direction] = new Map();
  }

  const references = snapshot[direction];
  if (!hasNodeReference(snapshot, direction, id, path)) {
    (references as Map<NodeId, NodeReference>).set(id, { id, path });
    return true;
  }

  return false;
}

/**
 * Return true if { id, path } is a valid reference in the node's references
 * array. Otherwise, return false.
 */
export function hasNodeReference(
  snapshot: NodeSnapshot,
  type: ReferenceDirection,
  id: NodeId,
  path: PathPart[],
): boolean {
  const references = snapshot[type];
  const reference = references && references.get(id);
  return !!(reference && isEqual(reference.path, path));
}

/**
 * Return values from reference map
 */
export function referenceValues(references: Map<NodeId, NodeReference> | undefined): NodeReference[] {
  if (!references) {
    return [];
  }
  return Array.from(references.values());
}

/**
 * Return true if of 'path' points to a valid reference field
 */
export function isReferenceField(
  snapshot: NodeSnapshot,
  path: PathPart[],
): boolean {
  const references = snapshot['outbound'];
  return referenceValues(references).some(reference => isEqual(reference.path, path));
}
