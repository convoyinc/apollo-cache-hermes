import { CacheContext } from '../context/CacheContext';
import { GraphSnapshot } from '../GraphSnapshot';
import { Serializable } from '../schema';
/**
 * Create serializable representation of GraphSnapshot.
 *
 * The output still contains 'undefined' value as it is expected that caller
 * will perform JSON.stringify which will strip off 'undefined' value or
 * turn it into 'null' if 'undefined' is in an array.
 *
 * @throws Will throw an error if there is no corresponding node type
 */
export declare function extract(graphSnapshot: GraphSnapshot, cacheContext: CacheContext): Serializable.GraphSnapshot;
