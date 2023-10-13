import isEqual from '@wry/equality';

import { NodeReference, NodeSnapshot } from '../nodes';
import { JsonObject, PathPart } from '../primitive';
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

  const fromIndex = getIndexOfGivenReference(references, id, path);
  if (fromIndex < 0) return false;
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
  path: PathPart[],
): boolean {
  let references = snapshot[direction];
  if (!references) {
    references = snapshot[direction] = [];
  }

  const idx = getIndexOfGivenReference(references, id, path);
  if (idx === -1) {
    references.push({ id, path });
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
  if (!references || getIndexOfGivenReference(references, id, path) === -1) return false;
  return true;
}

/**
 * Return index of { id, path } reference in references array.
 * Otherwise, return -1.
 */
export function getIndexOfGivenReference(references: NodeReference[], id: NodeId, path: PathPart[]): number {
  return references.findIndex((reference) => {
    return reference.id === id && isEqual(reference.path, path);
  });
}

/**
 * Return true if of 'path' points to a valid reference field
 */
export function isReferenceField(
  snapshot: NodeSnapshot,
  path: PathPart[],
): boolean {
  const references = snapshot['outbound'];
  if (!references) return false;
  const index = references.findIndex((reference) => {
    return isEqual(reference.path, path);
  });
  return (index >= 0);
}

function getCircularReplacer() {
  const ancestors: unknown[] = [];
  return function replacer(this: unknown, _key: string, value: unknown) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return '[Circular]';
    }
    ancestors.push(value);
    return value;
  };
}

export function safeStringify(value: JsonObject) {
  try {
    return JSON.stringify(value, undefined, 2);
  } catch (e) {
    return JSON.stringify(value, getCircularReplacer(), 2);
  }
}
