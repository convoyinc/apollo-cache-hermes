"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_utilities_1 = require("apollo-utilities");
var lodashGet = require("lodash.get");
var ParsedQueryNode_1 = require("../ParsedQueryNode");
var util_1 = require("../util");
var ConsoleTracer_1 = require("./ConsoleTracer");
var QueryInfo_1 = require("./QueryInfo");
/**
 * Configuration and shared state used throughout the cache's operation.
 */
var CacheContext = /** @class */ (function () {
    function CacheContext(config) {
        if (config === void 0) { config = {}; }
        /** All currently known & processed GraphQL documents. */
        this._queryInfoMap = new Map();
        /** All currently known & parsed queries, for identity mapping. */
        this._operationMap = new Map();
        this.entityIdForValue = _makeEntityIdMapper(config.entityIdForNode);
        this.entityTransformer = config.entityTransformer;
        this.freezeSnapshots = 'freeze' in config
            ? !!config.freeze
            : lodashGet(global, 'process.env.NODE_ENV') !== 'production';
        this.verbose = !!config.verbose;
        this.resolverRedirects = config.resolverRedirects || {};
        this.onChange = config.onChange;
        this.entityUpdaters = config.entityUpdaters || {};
        this.tracer = config.tracer || new ConsoleTracer_1.ConsoleTracer(!!config.verbose, config.logger);
        this._addTypename = config.addTypename || false;
    }
    /**
     * Performs any transformations of operation documents.
     *
     * Cache consumers should call this on any operation document prior to calling
     * any other method in the cache.
     */
    CacheContext.prototype.transformDocument = function (document) {
        if (this._addTypename && !document.hasBeenTransformed) {
            var transformedDocument = apollo_utilities_1.addTypenameToDocument(document);
            transformedDocument.hasBeenTransform = true;
            return transformedDocument;
        }
        return document;
    };
    /**
     * Returns a memoized & parsed operation.
     *
     * To aid in various cache lookups, the result is memoized by all of its
     * values, and can be used as an identity for a specific operation.
     */
    CacheContext.prototype.parseOperation = function (raw) {
        // It appears like Apollo or someone upstream is cloning or otherwise
        // modifying the queries that are passed down.  Thus, the operation source
        // is a more reliable cache key…
        var cacheKey = operationCacheKey(raw.document, raw.fragmentName);
        var operationInstances = this._operationMap.get(cacheKey);
        if (!operationInstances) {
            operationInstances = [];
            this._operationMap.set(cacheKey, operationInstances);
        }
        try {
            // Do we already have a copy of this guy?
            for (var operationInstances_1 = tslib_1.__values(operationInstances), operationInstances_1_1 = operationInstances_1.next(); !operationInstances_1_1.done; operationInstances_1_1 = operationInstances_1.next()) {
                var instance = operationInstances_1_1.value;
                if (instance.rootId !== raw.rootId)
                    continue;
                if (!apollo_utilities_1.isEqual(instance.variables, raw.variables))
                    continue;
                return instance;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (operationInstances_1_1 && !operationInstances_1_1.done && (_a = operationInstances_1.return)) _a.call(operationInstances_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var updateRaw = tslib_1.__assign({}, raw, { document: this.transformDocument(raw.document) });
        var info = this._queryInfo(cacheKey, updateRaw);
        var fullVariables = tslib_1.__assign({}, info.variableDefaults, updateRaw.variables);
        var operation = {
            info: info,
            rootId: updateRaw.rootId,
            parsedQuery: ParsedQueryNode_1.expandVariables(info.parsed, fullVariables),
            isStatic: !ParsedQueryNode_1.areChildrenDynamic(info.parsed),
            variables: updateRaw.variables,
        };
        operationInstances.push(operation);
        return operation;
        var e_1, _a;
    };
    /**
     * Retrieves a memoized QueryInfo for a given GraphQL document.
     */
    CacheContext.prototype._queryInfo = function (cacheKey, raw) {
        if (!this._queryInfoMap.has(cacheKey)) {
            this._queryInfoMap.set(cacheKey, new QueryInfo_1.QueryInfo(this, raw));
        }
        return this._queryInfoMap.get(cacheKey);
    };
    return CacheContext;
}());
exports.CacheContext = CacheContext;
/**
 * Wrap entityIdForNode so that it coerces all values to strings.
 */
function _makeEntityIdMapper(mapper) {
    if (mapper === void 0) { mapper = defaultEntityIdMapper; }
    return function entityIdForNode(node) {
        if (!util_1.isObject(node))
            return undefined;
        // We don't trust upstream implementations.
        var entityId = mapper(node);
        if (typeof entityId === 'string')
            return entityId;
        if (typeof entityId === 'number')
            return String(entityId);
        return undefined;
    };
}
exports._makeEntityIdMapper = _makeEntityIdMapper;
function defaultEntityIdMapper(node) {
    return node.id;
}
exports.defaultEntityIdMapper = defaultEntityIdMapper;
function operationCacheKey(document, fragmentName) {
    if (fragmentName) {
        return fragmentName + "\u2756" + document.loc.source.body;
    }
    return document.loc.source.body;
}
exports.operationCacheKey = operationCacheKey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGVDb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQ2FjaGVDb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUFrRTtBQUVsRSxzQ0FBeUM7QUFJekMsc0RBQXlFO0FBR3pFLGdDQUFtQztBQUVuQyxpREFBZ0Q7QUFDaEQseUNBQXdDO0FBc0l4Qzs7R0FFRztBQUNIO0lBaUNFLHNCQUFZLE1BQXVDO1FBQXZDLHVCQUFBLEVBQUEsV0FBdUM7UUFMbkQseURBQXlEO1FBQ3hDLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7UUFDOUQsa0VBQWtFO1FBQ2pELGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7UUFHdEUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1FBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxJQUFJLE1BQU07WUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUNqQixDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxLQUFLLFlBQVksQ0FBQztRQUMvRCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFDO1FBQ3hELElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQyxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLDZCQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWxGLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUM7SUFDbEQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsd0NBQWlCLEdBQWpCLFVBQWtCLFFBQXNCO1FBQ3RDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3RELElBQU0sbUJBQW1CLEdBQUcsd0NBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUQsbUJBQW1CLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztRQUM3QixDQUFDO1FBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxxQ0FBYyxHQUFkLFVBQWUsR0FBaUI7UUFDOUIscUVBQXFFO1FBQ3JFLDBFQUEwRTtRQUMxRSxnQ0FBZ0M7UUFDaEMsSUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkUsSUFBSSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUN4QixrQkFBa0IsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkQsQ0FBQzs7WUFFRCx5Q0FBeUM7WUFDekMsR0FBRyxDQUFDLENBQW1CLElBQUEsdUJBQUEsaUJBQUEsa0JBQWtCLENBQUEsc0RBQUE7Z0JBQXBDLElBQU0sUUFBUSwrQkFBQTtnQkFDakIsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDO29CQUFDLFFBQVEsQ0FBQztnQkFDN0MsRUFBRSxDQUFDLENBQUMsQ0FBQywwQkFBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUFDLFFBQVEsQ0FBQztnQkFDMUQsTUFBTSxDQUFDLFFBQVEsQ0FBQzthQUNqQjs7Ozs7Ozs7O1FBRUQsSUFBTSxTQUFTLHdCQUNWLEdBQUcsSUFDTixRQUFRLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FDL0MsQ0FBQztRQUVGLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2xELElBQU0sYUFBYSxHQUFHLHFCQUFLLElBQUksQ0FBQyxnQkFBZ0IsRUFBSyxTQUFTLENBQUMsU0FBUyxDQUFnQixDQUFDO1FBQ3pGLElBQU0sU0FBUyxHQUFHO1lBQ2hCLElBQUksTUFBQTtZQUNKLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN4QixXQUFXLEVBQUUsaUNBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQztZQUN4RCxRQUFRLEVBQUUsQ0FBQyxvQ0FBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFDLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUztTQUMvQixDQUFDO1FBQ0Ysa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRW5DLE1BQU0sQ0FBQyxTQUFTLENBQUM7O0lBQ25CLENBQUM7SUFFRDs7T0FFRztJQUNLLGlDQUFVLEdBQWxCLFVBQW1CLFFBQWdCLEVBQUUsR0FBaUI7UUFDcEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUkscUJBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDO0lBQzNDLENBQUM7SUFFSCxtQkFBQztBQUFELENBQUMsQUFwSEQsSUFvSEM7QUFwSFksb0NBQVk7QUFzSHpCOztHQUVHO0FBQ0gsNkJBQ0UsTUFBMkQ7SUFBM0QsdUJBQUEsRUFBQSw4QkFBMkQ7SUFFM0QsTUFBTSxDQUFDLHlCQUF5QixJQUFnQjtRQUM5QyxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFFdEMsMkNBQTJDO1FBQzNDLElBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxPQUFPLFFBQVEsS0FBSyxRQUFRLENBQUM7WUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFFBQVEsQ0FBQztZQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUQsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUNuQixDQUFDLENBQUM7QUFDSixDQUFDO0FBWkQsa0RBWUM7QUFFRCwrQkFBc0MsSUFBa0I7SUFDdEQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDakIsQ0FBQztBQUZELHNEQUVDO0FBRUQsMkJBQWtDLFFBQXNCLEVBQUUsWUFBcUI7SUFDN0UsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNqQixNQUFNLENBQUksWUFBWSxjQUFJLFFBQVEsQ0FBQyxHQUFJLENBQUMsTUFBTSxDQUFDLElBQU0sQ0FBQztJQUN4RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNuQyxDQUFDO0FBTEQsOENBS0MifQ==