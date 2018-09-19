"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_utilities_1 = require("apollo-utilities");
var errors_1 = require("../errors");
var util_1 = require("./util");
/**
 * Apollo-specific interface to the cache.
 */
var ApolloQueryable = /** @class */ (function () {
    function ApolloQueryable() {
    }
    ApolloQueryable.prototype.diff = function (options) {
        var rawOperation = util_1.buildRawOperationFromQuery(options.query, options.variables);
        var _a = this._queryable.read(rawOperation, options.optimistic), result = _a.result, complete = _a.complete;
        if (options.returnPartialData === false && !complete) {
            // TODO: Include more detail with this error.
            throw new errors_1.UnsatisfiedCacheError("diffQuery not satisfied by the cache.");
        }
        return { result: result, complete: complete };
    };
    ApolloQueryable.prototype.read = function (options) {
        var rawOperation = util_1.buildRawOperationFromQuery(options.query, options.variables, options.rootId);
        var _a = this._queryable.read(rawOperation, options.optimistic), result = _a.result, complete = _a.complete;
        if (!complete) {
            // TODO: Include more detail with this error.
            throw new errors_1.UnsatisfiedCacheError("read not satisfied by the cache.");
        }
        return result;
    };
    ApolloQueryable.prototype.readQuery = function (options, optimistic) {
        return this.read({
            query: options.query,
            variables: options.variables,
            optimistic: !!optimistic,
        });
    };
    ApolloQueryable.prototype.readFragment = function (options, optimistic) {
        // TODO: Support nested fragments.
        var rawOperation = util_1.buildRawOperationFromFragment(options.fragment, options.id, options.variables, options.fragmentName);
        return this._queryable.read(rawOperation, optimistic).result;
    };
    ApolloQueryable.prototype.write = function (options) {
        var rawOperation = util_1.buildRawOperationFromQuery(options.query, options.variables, options.dataId);
        this._queryable.write(rawOperation, options.result);
    };
    ApolloQueryable.prototype.writeQuery = function (options) {
        var rawOperation = util_1.buildRawOperationFromQuery(options.query, options.variables);
        this._queryable.write(rawOperation, options.data);
    };
    ApolloQueryable.prototype.writeFragment = function (options) {
        // TODO: Support nested fragments.
        var rawOperation = util_1.buildRawOperationFromFragment(options.fragment, options.id, options.variables, options.fragmentName);
        this._queryable.write(rawOperation, options.data);
    };
    ApolloQueryable.prototype.writeData = function () {
        throw new Error("writeData is not implemented by Hermes yet");
    };
    ApolloQueryable.prototype.transformDocument = function (doc) {
        return this._queryable.transformDocument(doc);
    };
    ApolloQueryable.prototype.transformForLink = function (document) {
        // @static directives are for the cache only.
        return apollo_utilities_1.removeDirectivesFromDocument([{ name: 'static' }], document);
    };
    ApolloQueryable.prototype.evict = function (options) {
        var rawOperation = util_1.buildRawOperationFromQuery(options.query, options.variables);
        return this._queryable.evict(rawOperation);
    };
    return ApolloQueryable;
}());
exports.ApolloQueryable = ApolloQueryable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnlhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUXVlcnlhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EscURBQWdFO0FBRWhFLG9DQUFrRDtBQUtsRCwrQkFBbUY7QUFFbkY7O0dBRUc7QUFDSDtJQUFBO0lBc0ZBLENBQUM7SUFsRkMsOEJBQUksR0FBSixVQUFRLE9BQTBCO1FBQ2hDLElBQU0sWUFBWSxHQUFHLGlDQUEwQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVFLElBQUEsMkRBQTZFLEVBQTNFLGtCQUFNLEVBQUUsc0JBQVEsQ0FBNEQ7UUFDcEYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixLQUFLLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDckQsNkNBQTZDO1lBQzdDLE1BQU0sSUFBSSw4QkFBcUIsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxNQUFNLENBQUMsRUFBRSxNQUFNLFFBQUEsRUFBRSxRQUFRLFVBQUEsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCw4QkFBSSxHQUFKLFVBQUssT0FBMEI7UUFDN0IsSUFBTSxZQUFZLEdBQUcsaUNBQTBCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1RixJQUFBLDJEQUE2RSxFQUEzRSxrQkFBTSxFQUFFLHNCQUFRLENBQTREO1FBQ3BGLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNkLDZDQUE2QztZQUM3QyxNQUFNLElBQUksOEJBQXFCLENBQUMsa0NBQWtDLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsbUNBQVMsR0FBVCxVQUF1QyxPQUFvQyxFQUFFLFVBQWlC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