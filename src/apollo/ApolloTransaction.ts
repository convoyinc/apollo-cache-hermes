import * as interfaces from './interfaces';

/**
 *
 */
export class ApolloTransaction implements interfaces.Cache {

  reset(): Promise<void> { // eslint-disable-line class-methods-use-this
    throw new Error(`reset() is not allowed within a transaction`);
  }

  diffQuery(query: interfaces.Cache.DiffQueryOptions): interfaces.Cache.DiffResult {
    // TODO: Complete Me
    return this.diffQuery(query);
  }

  read(query: interfaces.Cache.ReadOptions): any {
    // TODO: Complete Me
    return this.read(query);
  }

  readQuery<QueryType>(options: interfaces.Cache.ReadQueryOptions, optimistic?: true): QueryType {
    // TODO: Complete Me
    return this.readQuery(options, optimistic);
  }

  readFragment<FragmentType>(options: interfaces.Cache.ReadFragmentOptions, optimistic?: true): FragmentType | null {
    return this.readFragment(options, optimistic);
  }

  writeResult(write: interfaces.Cache.WriteResultOptions): void {
    // TODO: Complete Me
    return this.writeResult(write);
  }

  writeQuery(options: interfaces.Cache.WriteQueryOptions): void {
    return this.writeQuery(options);
  }

  writeFragment(options: interfaces.Cache.WriteFragmentOptions): void {
    return this.writeFragment(options);
  }

  removeOptimistic(id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`removeOptimistic() is not allowed within a transaction`);
  }

  performTransaction(transaction: interfaces.Cache.Transaction): void { // eslint-disable-line class-methods-use-this
    throw new Error(`performTransaction() is not allowed within a transaction`);
  }

  recordOptimisticTransaction(transaction: interfaces.Cache.Transaction, id: string): void { // eslint-disable-line class-methods-use-this
    throw new Error(`recordOptimisticTransaction() is not allowed within a transaction`);
  }

  watch(query: interfaces.Cache.WatchOptions, callback: interfaces.Cache.Callback): interfaces.Cache.Callback { // eslint-disable-line class-methods-use-this, max-len
    throw new Error(`watch() is not allowed within a transaction`);
  }

}
