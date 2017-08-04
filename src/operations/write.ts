import { Configuration } from '../Configuration';
import { GraphSnapshot } from '../GraphSnapshot';
import { Query } from '../schema';

import { EditedSnapshot, SnapshotEditor } from './SnapshotEditor';

/**
 * Merges a payload with an existing graph snapshot, generating a new one.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export function write(config: Configuration, snapshot: GraphSnapshot, query: Query, payload: any): EditedSnapshot {
  // We _could_ go purely functional with the editor, but it's honestly pretty
  // convenient to follow the builder function instead - it'd end up passing
  // around a context object anyway.
  const editor = new SnapshotEditor(config, snapshot);
  editor.mergePayload(query, payload);
  return editor.commit();
}
