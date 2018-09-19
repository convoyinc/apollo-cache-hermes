"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var read_1 = require("./read");
/**
 * Observes a query, triggering a callback when nodes within it have changed.
 *
 * @internal
 */
var QueryObserver = /** @class */ (function () {
    function QueryObserver(context, query, snapshot, callback) {
        this._context = context;
        this._query = query;
        this._callback = callback;
        this._update(snapshot);
    }
    /**
     * We expect the cache to tell us whenever there is a new snapshot, and which
     * nodes have changed.
     */
    QueryObserver.prototype.consumeChanges = function (snapshot, changedNodeIds) {
        if (!this._hasUpdate(changedNodeIds))
            return;
        this._update(snapshot);
    };
    /**
     * Whether there are any changed nodes that overlap with the ones we're
     * observing.
     */
    QueryObserver.prototype._hasUpdate = function (_changedNodeIds) {
        return true;
        // TODO: Bring back per-node updates once it's stable!
        // for (const nodeId of changedNodeIds) {
        //   if (this._result.nodeIds.has(nodeId)) return true;
        // }
        // return false;
    };
    /**
     * Re-query and trigger the callback.
     */
    QueryObserver.prototype._update = function (snapshot) {
        this._result = read_1.read(this._context, this._query, snapshot, true);
        this._callback(this._result);
    };
    return QueryObserver;
}());
exports.QueryObserver = QueryObserver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnlPYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlF1ZXJ5T2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSwrQkFBbUU7QUFJbkU7Ozs7R0FJRztBQUNIO0lBV0UsdUJBQVksT0FBcUIsRUFBRSxLQUFtQixFQUFFLFFBQXVCLEVBQUUsUUFBa0I7UUFDakcsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFFMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsc0NBQWMsR0FBZCxVQUFlLFFBQXVCLEVBQUUsY0FBMkI7UUFDakUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7T0FHRztJQUNLLGtDQUFVLEdBQWxCLFVBQW1CLGVBQTRCO1FBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDWixzREFBc0Q7UUFDdEQseUNBQXlDO1FBQ3pDLHVEQUF1RDtRQUN2RCxJQUFJO1FBQ0osZ0JBQWdCO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNLLCtCQUFPLEdBQWYsVUFBZ0IsUUFBdUI7UUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUgsb0JBQUM7QUFBRCxDQUFDLEFBakRELElBaURDO0FBakRZLHNDQUFhIn0=