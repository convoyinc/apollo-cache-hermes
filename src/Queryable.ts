import { JsonObject, JsonValue } from './primitive';
import { RawQuery } from './schema';

/**
 * Represents a queryable portion of our cache (the cache itself, transactions,
 * views, etc).
 */
export interface Queryable {

  /**
   * Reads the selection expressed by a query from the cache.
   *
   * TODO: Can we drop non-optimistic reads?
   * https://github.com/apollographql/apollo-client/issues/1971#issuecomment-319402170
   */
  read(query: RawQuery, optimistic?: boolean): { result?: JsonValue, complete: boolean };

  /**
   * Writes values for a selection to the cache.
   */
  write(query: RawQuery, payload: JsonObject): void;

  /**
   * Removes values for a selection to the cache
   */
  evict(query: RawQuery): { success: boolean };

}
