import { NodeSnapshot } from '../nodes';
import { PathPart } from '../primitive';
import { NodeId } from '../schema';
export declare type ReferenceDirection = 'inbound' | 'outbound';
/**
 * Mutates a snapshot, removing an inbound reference from it.
 *
 * Returns whether all references were removed.
 */
export declare function removeNodeReference(direction: ReferenceDirection, snapshot: NodeSnapshot, id: NodeId, path: PathPart[]): boolean;
/**
 * Mutates a snapshot, adding a new reference to it.
 */
export declare function addNodeReference(direction: ReferenceDirection, snapshot: NodeSnapshot, id: NodeId, path: PathPart[]): boolean;
/**
 * Return true if { id, path } is a valid reference in the node's references
 * array. Otherwise, return false.
 */
export declare function hasNodeReference(snapshot: NodeSnapshot, type: ReferenceDirection, id: NodeId, path: PathPart[]): boolean;
/**
 * Return true if of 'path' points to a valid reference field
 */
export declare function isReferenceField(snapshot: NodeSnapshot, path: PathPart[]): boolean;
