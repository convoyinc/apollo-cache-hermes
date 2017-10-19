import { GraphSnapshot } from '../GraphSnapshot';
import { Serializeable } from '../schema';

export function restore(serializedState: Serializeable.GraphSnapshot): GraphSnapshot {
  return new GraphSnapshot();
}
