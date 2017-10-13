import { GraphSnapshot } from '../GraphSnapshot';
import { JsonObject } from '../primitive';

export function restore(serializedState: JsonObject): GraphSnapshot {
  return new GraphSnapshot();
}
