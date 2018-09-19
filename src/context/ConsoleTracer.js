"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var INDENT = '  ';
/**
 * The default tracer used by the cache.
 *
 * By default it logs only warnings, but a verbose mode can be enabled to log
 * out all cache operations.
 */
var ConsoleTracer = /** @class */ (function () {
    function ConsoleTracer(_verbose, _logger) {
        if (_logger === void 0) { _logger = ConsoleTracer.DefaultLogger; }
        this._verbose = _verbose;
        this._logger = _logger;
        // Used when emulating grouping behavior.
        this._indent = 0;
    }
    ConsoleTracer.prototype.warning = function (message) {
        var metadata = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            metadata[_i - 1] = arguments[_i];
        }
        if (this._verbose)
            return;
        this._emit.apply(this, tslib_1.__spread(['warn', message], metadata));
    };
    ConsoleTracer.prototype.readEnd = function (operation, info) {
        if (!this._verbose)
            return;
        var message = this.formatOperation('read', operation);
        if (info.cacheHit) {
            this._emit('debug', message + " (cached)", info.result);
        }
        else {
            this._emit('info', message, info.result);
        }
    };
    ConsoleTracer.prototype.writeEnd = function (operation, info) {
        var _this = this;
        if (!this._verbose)
            return;
        var payload = info.payload, newSnapshot = info.newSnapshot, warnings = info.warnings;
        var message = this.formatOperation('write', operation);
        // Extended logging for writes that trigger warnings.
        if (warnings) {
            this._group(message, function () {
                _this._emit('warn', 'payload with warnings:', payload);
                try {
                    for (var warnings_1 = tslib_1.__values(warnings), warnings_1_1 = warnings_1.next(); !warnings_1_1.done; warnings_1_1 = warnings_1.next()) {
                        var warning = warnings_1_1.value;
                        _this._emit('warn', warning);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (warnings_1_1 && !warnings_1_1.done && (_a = warnings_1.return)) _a.call(warnings_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                _this._emit('debug', 'new snapshot:', newSnapshot);
                var e_1, _a;
            });
        }
        else {
            this._emit('debug', message, { payload: payload, newSnapshot: newSnapshot });
        }
    };
    ConsoleTracer.prototype.transactionEnd = function (error) {
        if (error) {
            this._emit('warn', "Rolling transaction back due to error:", error);
        }
    };
    // eslint-disable-next-line class-methods-use-this
    ConsoleTracer.prototype.formatOperation = function (action, operation) {
        var _a = operation.info, operationType = _a.operationType, operationName = _a.operationName;
        return action + "(" + operationType + " " + operationName + ")";
    };
    // Internal
    ConsoleTracer.prototype._emit = function (level, message) {
        var metadata = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            metadata[_i - 2] = arguments[_i];
        }
        if (this._indent) {
            for (var i = 0; i < this._indent; i++) {
                message = "" + INDENT + message;
            }
        }
        (_a = this._logger)[level].apply(_a, tslib_1.__spread([message], metadata));
        var _a;
    };
    ConsoleTracer.prototype._group = function (message, callback) {
        this._groupStart(message);
        try {
            callback();
        }
        finally {
            this._groupEnd();
        }
    };
    ConsoleTracer.prototype._groupStart = function (message) {
        if (this._logger.group && this._logger.groupEnd) {
            this._logger.group(message);
        }
        else {
            this._indent += 1;
            this._logger.info(message);
        }
    };
    ConsoleTracer.prototype._groupEnd = function () {
        if (this._logger.group && this._logger.groupEnd) {
            this._logger.groupEnd();
        }
        else {
            this._indent -= 1;
        }
    };
    return ConsoleTracer;
}());
exports.ConsoleTracer = ConsoleTracer;
(function (ConsoleTracer) {
    ConsoleTracer.DefaultLogger = {
        debug: _makeDefaultEmitter('debug'),
        info: _makeDefaultEmitter('info'),
        warn: _makeDefaultEmitter('warn'),
        // Grouping:
        group: _makeDefaultEmitter('group'),
        groupEnd: console.groupEnd ? console.groupEnd.bind(console) : function () { },
    };
})(ConsoleTracer = exports.ConsoleTracer || (exports.ConsoleTracer = {}));
exports.ConsoleTracer = ConsoleTracer;
function _makeDefaultEmitter(level) {
    var method = console[level] || console.log; // eslint-disable-line no-console
    return function defaultLogger(message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        method.call.apply(method, tslib_1.__spread([console, "[Cache] " + message], args));
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uc29sZVRyYWNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbnNvbGVUcmFjZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBRXBCOzs7OztHQUtHO0FBQ0g7SUFLRSx1QkFDVSxRQUFpQixFQUNqQixPQUEyRDtRQUEzRCx3QkFBQSxFQUFBLFVBQWdDLGFBQWEsQ0FBQyxhQUFhO1FBRDNELGFBQVEsR0FBUixRQUFRLENBQVM7UUFDakIsWUFBTyxHQUFQLE9BQU8sQ0FBb0Q7UUFMckUseUNBQXlDO1FBQ2pDLFlBQU8sR0FBRyxDQUFDLENBQUM7SUFLakIsQ0FBQztJQUVKLCtCQUFPLEdBQVAsVUFBUSxPQUFlO1FBQUUsa0JBQWtCO2FBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtZQUFsQixpQ0FBa0I7O1FBQ3pDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFBQyxNQUFNLENBQUM7UUFDMUIsSUFBSSxDQUFDLEtBQUssT0FBVixJQUFJLG9CQUFPLE1BQU0sRUFBRSxPQUFPLEdBQUssUUFBUSxHQUFFO0lBQzNDLENBQUM7SUFFRCwrQkFBTyxHQUFQLFVBQVEsU0FBNEIsRUFBRSxJQUFxQjtRQUN6RCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFBQyxNQUFNLENBQUM7UUFDM0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUssT0FBTyxjQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxLQUFLLENB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