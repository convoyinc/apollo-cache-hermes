import { EntitySnapshot } from './EntitySnapshot';
import { NodeSnapshot } from './NodeSnapshot';
import { ParameterizedValueSnapshot } from './ParameterizedValueSnapshot';
/**
 * Factory function for cloning nodes to their specific type signatures, while
 * preserving object shapes.
 */
export declare function cloneNodeSnapshot(parent: NodeSnapshot): EntitySnapshot | ParameterizedValueSnapshot;
