"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var deepFreeze = require("deep-freeze-strict");
/**
 * Maintains an identity map of all value snapshots that reference into a
 * particular version of the graph.
 *
 * Provides an immutable view into the graph at a point in time.
 *
 * Also provides a place to hang per-snapshot caches off of.
 */
var GraphSnapshot = /** @class */ (function () {
    /**
     * @internal
     */
    function GraphSnapshot(
    // TODO: Profile Object.create(null) vs Map.
    _values) {
        if (_values === void 0) { _values = Object.create(null); }
        this._values = _values;
        /** Cached results for queries. */
        this.readCache = new Map();
    }
    /**
     * Retrieves the value identified by `id`.
     */
    GraphSnapshot.prototype.getNodeData = function (id) {
        var snapshot = this.getNodeSnapshot(id);
        return snapshot ? snapshot.data : undefined;
    };
    /**
     * Returns whether `id` exists as an value in the graph.
     */
    GraphSnapshot.prototype.has = function (id) {
        return id in this._values;
    };
    /**
     * Retrieves the snapshot for the value identified by `id`.
     *
     * @internal
     */
    GraphSnapshot.prototype.getNodeSnapshot = function (id) {
        return this._values[id];
    };
    /**
     * Returns the set of ids present in the snapshot.
     *
     * @internal
     */
    GraphSnapshot.prototype.allNodeIds = function () {
        return Object.keys(this._values);
    };
    /**
     * Freezes the snapshot (generally for development mode)
     *
     * @internal
     */
    GraphSnapshot.prototype.freeze = function () {
        deepFreeze(this._values);
    };
    return GraphSnapshot;
}());
exports.GraphSnapshot = GraphSnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JhcGhTbmFwc2hvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkdyYXBoU25hcHNob3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQ0FBa0Q7QUFPbEQ7Ozs7Ozs7R0FPRztBQUNIO0lBS0U7O09BRUc7SUFDSDtJQUNFLDRDQUE0QztJQUNyQyxPQUE4QztRQUE5Qyx3QkFBQSxFQUFBLFVBQTJCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQTlDLFlBQU8sR0FBUCxPQUFPLENBQXVDO1FBUnZELGtDQUFrQztRQUNsQixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQTJELENBQUM7SUFRNUYsQ0FBQztJQUVKOztPQUVHO0lBQ0gsbUNBQVcsR0FBWCxVQUFZLEVBQVU7UUFDcEIsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDOUMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsMkJBQUcsR0FBSCxVQUFJLEVBQVU7UUFDWixNQUFNLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCx1Q0FBZSxHQUFmLFVBQWdCLEVBQVU7UUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxrQ0FBVSxHQUFWO1FBQ0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsOEJBQU0sR0FBTjtRQUNFLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVILG9CQUFDO0FBQUQsQ0FBQyxBQXZERCxJQXVEQztBQXZEWSxzQ0FBYSJ9