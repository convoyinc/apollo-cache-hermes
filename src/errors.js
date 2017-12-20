"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var makeError = require("make-error");
/**
 * Base error class for all errors emitted by the cache.
 *
 * Note that we rely on make-error so that we can safely extend the built in
 * Error in a cross-platform manner.
 */
var CacheError = /** @class */ (function (_super) {
    tslib_1.__extends(CacheError, _super);
    function CacheError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CacheError;
}(makeError.BaseError));
exports.CacheError = CacheError;
/**
 * An error with a query - generally occurs when parsing an error.
 */
var QueryError = /** @class */ (function (_super) {
    tslib_1.__extends(QueryError, _super);
    function QueryError(message, 
        // The path within the query where the error occurred.
        path) {
        var _this = _super.call(this, message + " at " + prettyPath(path)) || this;
        _this.path = path;
        return _this;
    }
    return QueryError;
}(CacheError));
exports.QueryError = QueryError;
/**
 * An error with a read query - generally occurs when data in cache is partial
 * or missing.
 */
var UnsatisfiedCacheError = /** @class */ (function (_super) {
    tslib_1.__extends(UnsatisfiedCacheError, _super);
    function UnsatisfiedCacheError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnsatisfiedCacheError;
}(CacheError));
exports.UnsatisfiedCacheError = UnsatisfiedCacheError;
/**
 * An error thrown when multiple fields within a query disagree about what they
 * are selecting.
 */
var ConflictingFieldsError = /** @class */ (function (_super) {
    tslib_1.__extends(ConflictingFieldsError, _super);
    function ConflictingFieldsError(message, 
        // The path within the query where the error occurred.
        path, 
        // The fields that are conflicting
        fields) {
        var _this = _super.call(this, "Conflicting field definitions: " + message, path) || this;
        _this.path = path;
        _this.fields = fields;
        return _this;
    }
    return ConflictingFieldsError;
}(QueryError));
exports.ConflictingFieldsError = ConflictingFieldsError;
/**
 * An error occurring during a cache operation, associated with a location in
 * the cache.
 */
var OperationError = /** @class */ (function (_super) {
    tslib_1.__extends(OperationError, _super);
    function OperationError(message, 
        // The path from the payload root to the node containing the error.
        prefixPath, 
        // The node id being processed when the error occurred.
        nodeId, 
        // The path within the node where the error occurred.
        path, 
        // A value associated with the error.
        value) {
        var _this = _super.call(this, message + " at " + prettyPath(tslib_1.__spread(prefixPath, path)) + " (node " + nodeId + ")") || this;
        _this.prefixPath = prefixPath;
        _this.nodeId = nodeId;
        _this.path = path;
        _this.value = value;
        return _this;
    }
    return OperationError;
}(CacheError));
exports.OperationError = OperationError;
/**
 * An error occurring while processing a payload for a write operation.
 */
var InvalidPayloadError = /** @class */ (function (_super) {
    tslib_1.__extends(InvalidPayloadError, _super);
    function InvalidPayloadError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InvalidPayloadError;
}(OperationError));
exports.InvalidPayloadError = InvalidPayloadError;
/**
 * An error occurring as the result of a cache bug.
 */
var CacheConsistencyError = /** @class */ (function (_super) {
    tslib_1.__extends(CacheConsistencyError, _super);
    function CacheConsistencyError(message, 
        // The path from the payload root to the node containing the error.
        prefixPath, 
        // The node id being processed when the error occurred.
        nodeId, 
        // The path within the node where the error occurred.
        path, 
        // A value that is the subject of the error
        value) {
        var _this = _super.call(this, "Hermes BUG: " + message, prefixPath, nodeId, path) || this;
        _this.prefixPath = prefixPath;
        _this.nodeId = nodeId;
        _this.path = path;
        _this.value = value;
        return _this;
    }
    return CacheConsistencyError;
}(OperationError));
exports.CacheConsistencyError = CacheConsistencyError;
/**
 * Renders a path as a pretty string.
 */
function prettyPath(path) {
    return path.length ? path.join('.') : '[]';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNDQUF3QztBQUt4Qzs7Ozs7R0FLRztBQUNIO0lBQWdDLHNDQUFtQjtJQUFuRDs7SUFBcUQsQ0FBQztJQUFELGlCQUFDO0FBQUQsQ0FBQyxBQUF0RCxDQUFnQyxTQUFTLENBQUMsU0FBUyxHQUFHO0FBQXpDLGdDQUFVO0FBRXZCOztHQUVHO0FBQ0g7SUFBZ0Msc0NBQVU7SUFDeEMsb0JBQ0UsT0FBZTtRQUNmLHNEQUFzRDtRQUN0QyxJQUFjO1FBSGhDLFlBS0Usa0JBQVMsT0FBTyxZQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUcsQ0FBQyxTQUMzQztRQUhpQixVQUFJLEdBQUosSUFBSSxDQUFVOztJQUdoQyxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBUkQsQ0FBZ0MsVUFBVSxHQVF6QztBQVJZLGdDQUFVO0FBVXZCOzs7R0FHRztBQUNIO0lBQTJDLGlEQUFVO0lBQXJEOztJQUF1RCxDQUFDO0lBQUQsNEJBQUM7QUFBRCxDQUFDLEFBQXhELENBQTJDLFVBQVUsR0FBRztBQUEzQyxzREFBcUI7QUFFbEM7OztHQUdHO0FBQ0g7SUFBNEMsa0RBQVU7SUFDcEQsZ0NBQ0UsT0FBZTtRQUNmLHNEQUFzRDtRQUN0QyxJQUFjO1FBQzlCLGtDQUFrQztRQUNsQixNQUFhO1FBTC9CLFlBT0Usa0JBQU0sb0NBQWtDLE9BQVMsRUFBRSxJQUFJLENBQUMsU0FDekQ7UUFMaUIsVUFBSSxHQUFKLElBQUksQ0FBVTtRQUVkLFlBQU0sR0FBTixNQUFNLENBQU87O0lBRy9CLENBQUM7SUFDSCw2QkFBQztBQUFELENBQUMsQUFWRCxDQUE0QyxVQUFVLEdBVXJEO0FBVlksd0RBQXNCO0FBWW5DOzs7R0FHRztBQUNIO0lBQW9DLDBDQUFVO0lBQzVDLHdCQUNFLE9BQWU7UUFDZixtRUFBbUU7UUFDbkQsVUFBc0I7UUFDdEMsdURBQXVEO1FBQ3ZDLE1BQWM7UUFDOUIscURBQXFEO1FBQ3JDLElBQWdCO1FBQ2hDLHFDQUFxQztRQUNyQixLQUFXO1FBVDdCLFlBV0Usa0JBQVMsT0FBTyxZQUFPLFVBQVUsa0JBQUssVUFBVSxFQUFLLElBQUksRUFBRSxlQUFVLE1BQU0sTUFBRyxDQUFDLFNBQ2hGO1FBVGlCLGdCQUFVLEdBQVYsVUFBVSxDQUFZO1FBRXRCLFlBQU0sR0FBTixNQUFNLENBQVE7UUFFZCxVQUFJLEdBQUosSUFBSSxDQUFZO1FBRWhCLFdBQUssR0FBTCxLQUFLLENBQU07O0lBRzdCLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUFkRCxDQUFvQyxVQUFVLEdBYzdDO0FBZFksd0NBQWM7QUFnQjNCOztHQUVHO0FBQ0g7SUFBeUMsK0NBQWM7SUFBdkQ7O0lBQXlELENBQUM7SUFBRCwwQkFBQztBQUFELENBQUMsQUFBMUQsQ0FBeUMsY0FBYyxHQUFHO0FBQTdDLGtEQUFtQjtBQUVoQzs7R0FFRztBQUNIO0lBQTJDLGlEQUFjO0lBQ3ZELCtCQUNFLE9BQWU7UUFDZixtRUFBbUU7UUFDbkQsVUFBc0I7UUFDdEMsdURBQXVEO1FBQ3ZDLE1BQWM7UUFDOUIscURBQXFEO1FBQ3JDLElBQWdCO1FBQ2hDLDJDQUEyQztRQUMzQixLQUFXO1FBVDdCLFlBV0Usa0JBQU0saUJBQWUsT0FBUyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQzFEO1FBVGlCLGdCQUFVLEdBQVYsVUFBVSxDQUFZO1FBRXRCLFlBQU0sR0FBTixNQUFNLENBQVE7UUFFZCxVQUFJLEdBQUosSUFBSSxDQUFZO1FBRWhCLFdBQUssR0FBTCxLQUFLLENBQU07O0lBRzdCLENBQUM7SUFDSCw0QkFBQztBQUFELENBQUMsQUFkRCxDQUEyQyxjQUFjLEdBY3hEO0FBZFksc0RBQXFCO0FBZ0JsQzs7R0FFRztBQUNILG9CQUFvQixJQUFnQjtJQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzdDLENBQUMifQ==