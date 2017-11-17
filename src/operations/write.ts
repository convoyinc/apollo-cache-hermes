import { CacheContext } from '../context';
import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';
import { RawOperation } from '../schema';

import { EditedSnapshot, SnapshotEditor } from './SnapshotEditor';

/**
 * Merges a payload with an existing graph snapshot, generating a new one.
 *
 * Performs the minimal set of edits to generate new immutable versions of each
 * node, while preserving immutability of the parent snapshot.
 */
export function write(context: CacheContext, snapshot: GraphSnapshot, raw: RawOperation, payload: JsonObject): EditedSnapshot {
  let tracerContext;
  if (context.tracer.writeStart) {
    tracerContext = context.tracer.writeStart(raw, payload);
  }

  // We _could_ go purely functional with the editor, but it's honestly pretty
  // convenient to follow the builder function instead - it'd end up passing
  // around a context object anyway.
  const editor = new SnapshotEditor(context, snapshot);
  editor.mergePayload(raw, payload);
  const result = editor.commit();

  if (context.tracer.writeEnd) {
    context.tracer.writeEnd(context.parseOperation(raw), payload, result, tracerContext);
  }

  return result;
}
