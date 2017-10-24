import { GraphSnapshot } from '../GraphSnapshot';
import { Serializable } from '../schema';

export function restore(serializedState: Serializable.GraphSnapshot): GraphSnapshot {
  return new GraphSnapshot();
}
