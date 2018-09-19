import { CacheSnapshot } from '../CacheSnapshot';
import { CacheContext } from '../context';
import { Serializable } from '../schema';
/**
 * Restore GraphSnapshot from serializable representation.
 *
 * The parameter 'serializedState' is likely to be result running JSON.stringify
 * on a result of 'extract' method. This function will directly reference object
 * in the serializedState.
 *
 * @throws Will throw an error if 'type' in serializedState cannot be mapped to
 *    different sub-class of NodeSnapshot.
 * @throws Will throw an error if there is undefined in sparse array
 */
export declare function restore(serializedState: Serializable.GraphSnapshot, cacheContext: CacheContext): {
    cacheSnapshot: CacheSnapshot;
    editedNodeIds: Set<string>;
};
