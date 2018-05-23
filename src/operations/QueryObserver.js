"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
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
        if (!this._result.nodeIds)
            return true;
        if (!this._result.complete)
            return true;
        try {
            for (var _changedNodeIds_1 = tslib_1.__values(_changedNodeIds), _changedNodeIds_1_1 = _changedNodeIds_1.next(); !_changedNodeIds_1_1.done; _changedNodeIds_1_1 = _changedNodeIds_1.next()) {
                var nodeId = _changedNodeIds_1_1.value;
                if (this._result.nodeIds.has(nodeId))
                    return true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_changedNodeIds_1_1 && !_changedNodeIds_1_1.done && (_a = _changedNodeIds_1.return)) _a.call(_changedNodeIds_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
        var e_1, _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnlPYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlF1ZXJ5T2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsK0JBQW1FO0FBSW5FOzs7O0dBSUc7QUFDSDtJQVdFLHVCQUFZLE9BQXFCLEVBQUUsS0FBbUIsRUFBRSxRQUF1QixFQUFFLFFBQWtCO1FBQ2pHLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBRTFCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7T0FHRztJQUNILHNDQUFjLEdBQWQsVUFBZSxRQUF1QixFQUFFLGNBQTJCO1FBQ2pFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7O09BR0c7SUFDSyxrQ0FBVSxHQUFsQixVQUFtQixlQUE0QjtRQUM3QyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzs7WUFDeEMsR0FBRyxDQUFDLENBQWlCLElBQUEsb0JBQUEsaUJBQUEsZUFBZSxDQUFBLGdEQUFBO2dCQUEvQixJQUFNLE1BQU0sNEJBQUE7Z0JBQ2YsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDbkQ7Ozs7Ozs7OztRQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7O0lBQ2YsQ0FBQztJQUVEOztPQUVHO0lBQ0ssK0JBQU8sR0FBZixVQUFnQixRQUF1QjtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFSCxvQkFBQztBQUFELENBQUMsQUFqREQsSUFpREM7QUFqRFksc0NBQWEifQ==