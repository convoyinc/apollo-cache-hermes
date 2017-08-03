/**
 *
 */
export function addToSet<T>(target: Set<T>, source: Iterable<T>): void {
  for (const value of source) {
    target.add(value);
  }
}
