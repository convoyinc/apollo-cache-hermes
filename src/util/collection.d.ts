import { PathPart } from '../primitive';
/**
 * Gets a nested value, with support for blank paths.
 */
export declare function deepGet(target: any, path: PathPart[]): any;
export declare function pathBeginsWith(target: PathPart[], prefix: PathPart[]): boolean;
/**
 * Adds values to a set, mutating it.
 */
export declare function addToSet<T>(target: Set<T>, source: Iterable<T>): void;
/**
 * An immutable deep set, where it only creates containers (objects/arrays) if
 * they differ from the _original_ object copied from - even if
 * `_setValue` is called against it multiple times.
 */
export declare function lazyImmutableDeepSet<TEntity>(target: TEntity | undefined, original: TEntity | undefined, path: PathPart[], value: any): TEntity;
