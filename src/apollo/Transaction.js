"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lodashIsEqual = require("lodash.isequal");
var lodasGet = require("lodash.get");
var Queryable_1 = require("./Queryable");
function getOriginalFieldArguments(id) {
    // Split `${containerId}❖${JSON.stringify(path)}❖${JSON.stringify(args)}`
    var idComponents = id.split('❖');
    if (idComponents.length < 3) {
        return undefined;
    }
    return JSON.parse(idComponents[2]);
}
/**
 * Apollo-specific transaction interface.
 */
var ApolloTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(ApolloTransaction, _super);
    function ApolloTransaction(
    /** The underlying transaction. */
    _queryable) {
        var _this = _super.call(this) || this;
        _this._queryable = _queryable;
        return _this;
    }
    ApolloTransaction.prototype.reset = function () {
        throw new Error("reset() is not allowed within a transaction");
    };
    ApolloTransaction.prototype.removeOptimistic = function (_id) {
        throw new Error("removeOptimistic() is not allowed within a transaction");
    };
    ApolloTransaction.prototype.performTransaction = function (transaction) {
        transaction(this);
    };
    ApolloTransaction.prototype.recordOptimisticTransaction = function (_transaction, _id) {
        throw new Error("recordOptimisticTransaction() is not allowed within a transaction");
    };
    ApolloTransaction.prototype.watch = function (_query) {
        throw new Error("watch() is not allowed within a transaction");
    };
    ApolloTransaction.prototype.restore = function () {
        throw new Error("restore() is not allowed within a transaction");
    };
    ApolloTransaction.prototype.extract = function () {
        throw new Error("extract() is not allowed within a transaction");
    };
    /**
     * A helper function to be used when doing EntityUpdate.
     * The method enable users to interate different parameterized at an editPath
     * of a given container Id.
     *
     * The 'updateFieldCallback' is a callback to compute new value given previous
     * list of references and an object literal of parameterized arguments at the
     * given path.
     */
    ApolloTransaction.prototype.updateListOfReferences = function (containerId, editPath, _a, _b, updateFieldCallback) {
        var writeFragment = _a.writeFragment, writeFragmentName = _a.writeFragmentName;
        var readFragment = _b.readFragment, readFragmentName = _b.readFragmentName;
        var currentContainerNode = this._queryable.getCurrentNodeSnapshot(containerId);
        if (!currentContainerNode || !currentContainerNode.outbound) {
            return;
        }
        try {
            for (var _c = tslib_1.__values(currentContainerNode.outbound), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = _d.value, outboundId = _e.id, path = _e.path;
                if (lodashIsEqual(editPath, path)) {
                    var fieldArguments = getOriginalFieldArguments(outboundId);
                    if (fieldArguments) {
                        var cacheResult = void 0;
                        try {
                            cacheResult = this.readFragment({
                                id: containerId,
                                fragment: readFragment,
                                fragmentName: readFragmentName,
                                variables: fieldArguments,
                            }, this._queryable.isOptimisticTransaction());
                        }
                        catch (error) {
                            continue;
                        }
                        var previousData = lodasGet(cacheResult, path);
                        if (!Array.isArray(previousData)) {
                            throw new Error("updateListOfReferences() expects previousData to be an array.");
                        }
                        var updateData = updateFieldCallback(previousData, fieldArguments);
                        if (updateData !== previousData) {
                            this.writeFragment({
                                id: outboundId,
                                fragment: writeFragment,
                                fragmentName: writeFragmentName,
                                variables: fieldArguments,
                                data: updateData,
                            });
                        }
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _f;
    };
    return ApolloTransaction;
}(Queryable_1.ApolloQueryable));
exports.ApolloTransaction = ApolloTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJUcmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw4Q0FBaUQ7QUFDakQscUNBQXdDO0FBUXhDLHlDQUE4QztBQUU5QyxtQ0FBbUMsRUFBVTtJQUMzQyx5RUFBeUU7SUFDekUsSUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVEOztHQUVHO0FBQ0g7SUFBdUMsNkNBQWU7SUFFcEQ7SUFDRSxrQ0FBa0M7SUFDeEIsVUFBNEI7UUFGeEMsWUFJRSxpQkFBTyxTQUNSO1FBSFcsZ0JBQVUsR0FBVixVQUFVLENBQWtCOztJQUd4QyxDQUFDO0lBRUQsaUNBQUssR0FBTDtRQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsNENBQWdCLEdBQWhCLFVBQWlCLEdBQVc7UUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRCw4Q0FBa0IsR0FBbEIsVUFBbUIsV0FBdUM7UUFDeEQsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRCx1REFBMkIsR0FBM0IsVUFBNEIsWUFBd0MsRUFBRSxHQUFXO1FBQy9FLE1BQU0sSUFBSSxLQUFLLENBQUMsbUVBQW1FLENBQUMsQ0FBQztJQUN2RixDQUFDO0lBRUQsaUNBQUssR0FBTCxVQUFNLE1BQTBCO1FBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNB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