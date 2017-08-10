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

  const fromIndex = references.findIndex((reference) => {
    return lodashIsEqual(reference.id, id) && lodashIsEqual(reference.path, path);
  });
  references.splice(fromIndex, 1);

  if (!references.length) {
    (snapshot as any)[direction] = undefined;
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
    references = (snapshot as any)[direction] = [];
  }

  references.push({ id, path });
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
  for (const reference of references) {
    if (reference.id === id && lodashIsEqual(reference.path, path)) return true;
  }

  return false;
}
