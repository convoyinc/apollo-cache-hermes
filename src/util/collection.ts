import { PathPart } from '../primitive';

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
    if (!targetNode || targetNode === originalNode) {
      if (typeof key === 'number') {
        targetNode = originalNode ? [...originalNode] : [];
      } else if (typeof key === 'string') {
        targetNode = originalNode ? { ...originalNode } : {};
      } else {
        throw new Error(`Unknown path type ${JSON.stringify(key)} in path ${JSON.stringify(path)} at index ${i}`);
      }

      if (i === 0) {
        // Make sure we have a reference to the new target.
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

  // Finally, set the value in our previously or newly cloned target.
  parentNode[path[path.length - 1]] = value;

  return target as TEntity;
}
