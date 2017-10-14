import { GraphSnapshot } from '../GraphSnapshot';
import { Serializeable } from '../primitive';

export function restore(serializedState: Serializeable.GraphSnapshot): GraphSnapshot {
  return new GraphSnapshot();
}
