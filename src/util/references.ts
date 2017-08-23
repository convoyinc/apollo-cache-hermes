import lodashIsEqual = require('lodash.isequal');

import { NodeSnapshot } from '../NodeSnapshot';
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
  path?: PathPart[],
): boolean {
  const references = snapshot[direction];
  if (!references) {
    throw new Error(`Inconsistent GraphSnapshot: Expected snapshot to have ${direction} references`);
  }

  const fromIndex = getIndexOfGivenReference(references, id, path);
  references.splice(fromIndex, 1);

  if (!references.length) {
    snapshot[direction] = undefined;
  }

  return !references.length;
}

/**
 * Mutates a snapshot, adding a new reference to it.
 */
export function addNodeReference(
  direction: ReferenceDirection,
  snapshot: NodeSnapshot,
  id: NodeId,
  path?: PathPart[],
): void {
  let references = snapshot[direction];
  if (!references) {
    references = snapshot[direction] = [];
  }

  const idx = getIndexOfGivenReference(references, id, path);
  if (idx === -1) {
    references.push({ id, path });
  }
}

/**
 * Whether a snapshot has a specific reference.
 */
export function hasNodeReference(
  snapshot: NodeSnapshot,
  type: ReferenceDirection,
  id: NodeId,
  path?: PathPart[],
): boolean {
  const references = snapshot[type];
  if (!references) return false;
  const idx = getIndexOfGivenReference(references, id, path);
  return idx !== -1;
}

/**
 * Return index of { id, path } reference in references array.
 * Otherwise, return -1.
 */
function getIndexOfGivenReference(references: NodeSnapshot.Reference[], id: NodeId, path?: PathPart[]): number {
  return references.findIndex((reference) => {
    return reference.id === id && lodashIsEqual(reference.path, path);
  });
}
