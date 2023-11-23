import { Cache } from '@apollo/client';

import { JsonObject, JsonValue } from './primitive';
import { RawOperation } from './schema';
import { DocumentNode } from './util';

/**
 * Represents a queryable portion of our cache (the cache itself, transactions,
 * views, etc).
 */
export interface Queryable {

  /**
   * Performs any transformations of operation documents.
   *
   * Cache consumers should call this on any operation document prior to calling
   * any other method in the cache.
   */
  transformDocument(document: DocumentNode): DocumentNode;

  /**
   * Reads the selection expressed by a query from the cache.
   *
   * TODO: Can we drop non-optimistic reads?
   * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
   */
  read(query: RawOperation, optimistic?: boolean): Cache.DiffResult<JsonValue>;

  /**
   * Writes values for a selection to the cache.
   */
  write(query: RawOperation, payload: JsonObject, broadcast: boolean | undefined): void;

  modify<Entity>(options: Cache.ModifyOptions<Entity>): boolean;

  evict(options: Cache.EvictOptions): boolean;
}
