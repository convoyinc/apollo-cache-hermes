"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Cache_1 = require("../Cache");
var Queryable_1 = require("./Queryable");
var Transaction_1 = require("./Transaction");
var util_1 = require("./util");
/**
 * Apollo-specific interface to the cache.
 */
var Hermes = /** @class */ (function (_super) {
    tslib_1.__extends(Hermes, _super);
    function Hermes(configuration) {
        var _this = _super.call(this) || this;
        _this._queryable = new Cache_1.Cache(configuration);
        return _this;
    }
    // TODO (yuisu): data can be typed better with update of ApolloCache API
    Hermes.prototype.restore = function (data, migrationMap, verifyOptions) {
        var verifyQuery = verifyOptions && util_1.buildRawOperationFromQuery(verifyOptions.query, verifyOptions.variables);
        this._queryable.restore(data, migrationMap, verifyQuery);
        return this;
    };
    // TODO (yuisu): return can be typed better with update of ApolloCache API
    Hermes.prototype.extract = function (optimistic, pruneOptions) {
        if (optimistic === void 0) { optimistic = false; }
        var pruneQuery = pruneOptions && util_1.buildRawOperationFromQuery(pruneOptions.query, pruneOptions.variables);
        return this._queryable.extract(optimistic, pruneQuery);
    };
    Hermes.prototype.reset = function () {
        return this._queryable.reset();
    };
    Hermes.prototype.removeOptimistic = function (id) {
        this._queryable.rollback(id);
    };
    Hermes.prototype.performTransaction = function (transaction) {
        this._queryable.transaction(function (t) { return transaction(new Transaction_1.ApolloTransaction(t)); });
    };
    Hermes.prototype.recordOptimisticTransaction = function (transaction, id) {
        this._queryable.transaction(id, function (t) { return transaction(new Transaction_1.ApolloTransaction(t)); });
    };
    Hermes.prototype.watch = function (options) {
        var query = util_1.buildRawOperationFromQuery(options.query, options.variables, options.rootId);
        return this._queryable.watch(query, options.callback);
    };
    Hermes.prototype.getCurrentCacheSnapshot = function () {
        return this._queryable.getSnapshot();
    };
    return Hermes;
}(Queryable_1.ApolloQueryable));
exports.Hermes = Hermes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVybWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSGVybWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQU1BLGtDQUErQztBQUsvQyx5Q0FBOEM7QUFDOUMsNkNBQWtEO0FBQ2xELCtCQUFvRDtBQUVwRDs7R0FFRztBQUNIO0lBQTRCLGtDQUFlO0lBSXpDLGdCQUFZLGFBQTBDO1FBQXRELFlBQ0UsaUJBQU8sU0FFUjtRQURDLEtBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxhQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7O0lBQzdDLENBQUM7SUFFRCx3RUFBd0U7SUFDeEUsd0JBQU8sR0FBUCxVQUFRLElBQVMsRUFBRSxZQUEyQixFQUFFLGFBQTBDO1FBQ3hGLElBQU0sV0FBVyxHQUFHLGFBQWEsSUFBSSxpQ0FBMEIsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5RyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsMEVBQTBFO0lBQzFFLHdCQUFPLEdBQVAsVUFBUSxVQUEyQixFQUFFLFlBQXlDO1FBQXRFLDJCQUFBLEVBQUEsa0JBQTJCO1FBQ2pDLElBQU0sVUFBVSxHQUFHLFlBQVksSUFBSSxpQ0FBMEIsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELGlDQUFnQixHQUFoQixVQUFpQixFQUFVO1FBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxtQ0FBa0IsR0FBbEIsVUFBbUIsV0FBdUM7UUFDeEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxXQUFXLENBQUMsSUFBSSwrQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFyQyxDQUFxQyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVELDRDQUEyQixHQUEzQixVQUE0QixXQUF1QyxFQUFFLEVBQVU7UUFDN0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsV0FBVyxDQUFDLElBQUksK0JBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBckMsQ0FBcUMsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFFRCxzQkFBSyxHQUFMLFVBQU0sT0FBb0M7UUFDeEMsSUFBTSxLQUFLLEdBQUcsaUNBQTBCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsd0NBQXVCLEdBQXZCO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUNILGFBQUM7QUFBRCxDQUFDLEFBOUNELENBQTRCLDJCQUFlLEdBOEMxQztBQTlDWSx3QkFBTSJ9