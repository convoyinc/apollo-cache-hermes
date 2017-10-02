import { JsonObject, JsonValue } from './primitive';
import { RawOperation } from './schema';

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
  read(query: RawOperation, optimistic?: boolean): { result?: JsonValue, complete: boolean };

  /**
   * Writes values for a selection to the cache.
   */
  write(query: RawOperation, payload: JsonObject): void;

}
