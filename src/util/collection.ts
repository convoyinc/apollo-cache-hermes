import { PathPart } from '../primitive';

/**
 * Gets a nested value, with support for blank paths.
 */
export function deepGet(target: any, path: PathPart[]): any {
  let index = 0;
  const { length } = path;
  while (target != null && index < length) {
    target = target[path[index++]];
  }

  return target;
}

export function pathBeginsWith(target: PathPart[], prefix: PathPart[]) {
  if (target.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== target[i]) return false;
  }
  return true;
}

/**
 * Adds values to a set, mutating it.
 */
export function addToSet<T>(target: Set<T>, source: Iterable<T>): void {
  for (const value of source) {
    target.add(value);
  }
}

/**
 * An immutable deep set, where it only creates containers (objects/arrays) if
 * they differ from the _original_ object copied from - even if
 * `_setValue` is called against it multiple times.
 */
export function lazyImmutableDeepSet<TEntity>(
  target: TEntity | undefined,
  original: TEntity | undefined,
  path: PathPart[],
  value: any,
  deleted?: boolean,
): TEntity {
  if (!path.length) return value;

  let parentNode;
  let targetNode: any = target;
  let originalNode: any = original;
  // We assume that the last path component is the key of a value; not a
  // container, so we stop there.
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    // If the target still references the original's objects, we need to diverge
    if (!targetNode || targetNode === originalNode || !Object.isExtensible(targetNode)) {
      if (typeof key === 'number') {
        targetNode = originalNode ? [...originalNode] : [];
      } else if (typeof key === 'string') {
        targetNode = originalNode ? { ...originalNode } : {};
      } else {
        throw new Error(`Unknown path type ${JSON.stringify(key)} in path ${JSON.stringify(path)} at index ${i}`);
      }

      if (i === 0) {
        // Make sure we have a reference to the new target. We can keep the
        // reference here because "target" is pointing as currentNode.data.
        target = targetNode;
      } else {
        parentNode[path[i - 1]] = targetNode;
      }
    }

    // Regardless, we keep walking deeper.
    parentNode = targetNode;
    targetNode = targetNode[key];
    originalNode = originalNode && originalNode[key];
  }

  if (deleted) {
    delete parentNode[path[path.length - 1]];
  } else {
    // Finally, set the value in our previously or newly cloned target.
    parentNode[path[path.length - 1]] = value;
  }

  return target as TEntity;
}

export function setsHaveSomeIntersection<TValue>(left: Set<TValue>, right: Set<TValue>) {
  // Walk the smaller set.
  const [toIterate, toCheck] = left.size > right.size ? [right, left] : [left, right];

  for (const value of toIterate) {
    if (toCheck.has(value)) return true;
  }
  return false;
}
