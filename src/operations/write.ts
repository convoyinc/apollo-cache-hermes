import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { Query } from '../schema';

import { EditedSnapshot, SnapshotEditor } from './SnapshotEditor';

/**
 * Merges a payload with an existing graph snapshot, generating a new one.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export function write(context: CacheContext, snapshot: GraphSnapshot, query: Query, payload: object): EditedSnapshot {
  // We _could_ go purely functional with the editor, but it's honestly pretty
  // convenient to follow the builder function instead - it'd end up passing
  // around a context object anyway.
  const editor = new SnapshotEditor(context, snapshot);
  editor.mergePayload(query, payload);
  return editor.commit();
}
