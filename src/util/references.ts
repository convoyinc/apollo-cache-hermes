import lodashIsEqual = require('lodash.isequal');

import { NodeSnapshot } from '../NodeSnapshot';
import { PathPart } from '../primitive';
import { NodeId } from '../schema';

export type ReferenceType = 'inbound' | 'outbound';

/**
 * Mutates a snapshot, removing an inbound reference from it.
 *
 * Returns whether all references were removed.
 */
export function removeNodeReference(type: ReferenceType, snapshot: NodeSnapshot, id: NodeId, path?: PathPart[]): boolean {
  const references = snapshot[type];
  if (!references) {
    throw new Error(`Inconsistent GraphSnapshot: Expected snapshot to have ${type} references`);
  }

  const fromIndex = references.findIndex((reference) => {
    return lodashIsEqual(reference.id, id) && lodashIsEqual(reference.path, path);
  });
  references.splice(fromIndex, 1);

  if (!references.length) {
    (snapshot as any)[type] = undefined;
  }

  return !references.length;
}

/**
 * Mutates a snapshot, adding a new reference to it.
 */
export function addNodeReference(type: ReferenceType, snapshot: NodeSnapshot, id: NodeId, path?: PathPart[]): void {
  let references = snapshot[type];
  if (!references) {
    references = (snapshot as any)[type] = [];
  }

  references.push({ id, path });
}

/**
 * Whether a snapshot has a specific reference.
 */
export function hasNodeReference(snapshot: NodeSnapshot, type: ReferenceType, id: NodeId, path?: PathPart[]): boolean {
  const references = snapshot[type];
  if (!references) return false;
  for (const reference of references) {
    if (reference.id === id && lodashIsEqual(reference.path, path)) return true;
  }

  return false;
}
