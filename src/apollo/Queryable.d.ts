import { Cache, DataProxy } from 'apollo-cache';
import { Queryable } from '../Queryable';
import { DocumentNode } from '../util';
/**
 * Apollo-specific interface to the cache.
 */
export declare abstract class ApolloQueryable implements DataProxy {
    /** The underlying Hermes cache. */
    protected abstract _queryable: Queryable;
    diff<T>(options: Cache.DiffOptions): Cache.DiffResult<T | any>;
    read(options: Cache.ReadOptions): any;
    readQuery<QueryType, TVariables = any>(options: DataProxy.Query<TVariables>, optimistic?: true): QueryType;
    readFragment<FragmentType, TVariables = any>(options: DataProxy.Fragment<TVariables>, optimistic?: true): FragmentType | null;
    write(options: Cache.WriteOptions): void;
    writeQuery<TData = any, TVariables = any>(options: Cache.WriteQueryOptions<TData, TVariables>): void;
    writeFragment<TData = any, TVariables = any>(options: Cache.WriteFragmentOptions<TData, TVariables>): void;
    writeData(): void;
    transformDocument(doc: DocumentNode): DocumentNode;
    transformForLink(document: DocumentNode): DocumentNode;
    evict(options: Cache.EvictOptions): Cache.EvictionResult;
}
