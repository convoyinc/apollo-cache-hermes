"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Maintains an immutable, point-in-time view of the cache.
 *
 * We make CacheSnapshot a class instead of an interface because
 * to garuntee consistentcy of properties and their order. This
 * improves performance as JavaScript VM can do better optimization.
 */
var CacheSnapshot = /** @class */ (function () {
    function CacheSnapshot(
    /** The base snapshot for this version of the cache. */
    baseline, 
    /** The optimistic view of this version of this cache (may be base). */
    optimistic, 
    /** Individual optimistic updates for this version. */
    optimisticQueue) {
        this.baseline = baseline;
        this.optimistic = optimistic;
        this.optimisticQueue = optimisticQueue;
    }
    return CacheSnapshot;
}());
exports.CacheSnapshot = CacheSnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGVTbmFwc2hvdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNhY2hlU25hcHNob3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7Ozs7O0dBTUc7QUFDSDtJQUNFO0lBQ0UsdURBQXVEO0lBQ2hELFFBQXVCO0lBQzlCLHVFQUF1RTtJQUNoRSxVQUF5QjtJQUNoQyxzREFBc0Q7SUFDL0MsZUFBc0M7UUFKdEMsYUFBUSxHQUFSLFFBQVEsQ0FBZTtRQUV2QixlQUFVLEdBQVYsVUFBVSxDQUFlO1FBRXpCLG9CQUFlLEdBQWYsZUFBZSxDQUF1QjtJQUM1QyxDQUFDO0lBQ04sb0JBQUM7QUFBRCxDQUFDLEFBVEQsSUFTQztBQVRZLHNDQUFhIn0=