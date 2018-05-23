"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_utilities_1 = require("apollo-utilities");
var errors_1 = require("./errors");
var util_1 = require("./util");
/**
 * The GraphQL AST is parsed down into a simple tree containing all information
 * the cache requires to read/write associated payloads.
 *
 * A parsed query has no notion of fragments, or other such redirections; they
 * are flattened into query nodes when parsed.
 */
var ParsedQueryNode = /** @class */ (function () {
    function ParsedQueryNode(
        /** Any child fields. */
        children, 
        /**
         * The name of the field (as defined by the schema).
         *
         * Omitted by default (can be inferred by its key in a node map), unless
         * the field is aliased.
         */
        schemaName, 
        /** The map of the field's arguments and their values, if parameterized. */
        args, 
        /**
         * Whether a (transitive) child contains arguments.  This allows us to
         * ignore whole subtrees in some situations if they were completely static.
         * */
        hasParameterizedChildren, selection, // TODO(jamesreggio): TS compiler won't let me type this as SelectionNode.
        excluded) {
        this.children = children;
        this.schemaName = schemaName;
        this.args = args;
        this.hasParameterizedChildren = hasParameterizedChildren;
        this.selection = selection;
        this.excluded = excluded;
    }
    return ParsedQueryNode;
}());
exports.ParsedQueryNode = ParsedQueryNode;
/**
 * Represents the location a variable should be used as an argument to a
 * parameterized field.
 *
 * Note that variables can occur _anywhere_ within an argument, not just at the
 * top level.
 */
var VariableArgument = /** @class */ (function () {
    function VariableArgument(
        /** The name of the variable. */
        name) {
        this.name = name;
    }
    return VariableArgument;
}());
exports.VariableArgument = VariableArgument;
/**
 * Maintains a cache of SelectionSetNode to ParsedQuery mappings.
 *
 * The cache is keyed on the JSON-stringified SelectionSetNode, so equivalent
 * SelectionSets will resolve the same ParsedQuery. This helps with avoiding
 * duplicate writes of the same entity for a given SelectionSet.
 */
var SelectionSetCache = /** @class */ (function () {
    function SelectionSetCache() {
        this._cache = {};
    }
    SelectionSetCache.prototype.set = function (key, value) {
        var hash = SelectionSetCache._hash(key);
        if (hash) {
            this._cache[hash] = value;
        }
    };
    SelectionSetCache.prototype.get = function (key) {
        var hash = SelectionSetCache._hash(key);
        return hash ? this._cache[hash] : undefined;
    };
    SelectionSetCache._hash = function (key) {
        try {
            // JSON.stringify is assumed to be deterministic on the VMs we target.
            // Technically, the ordering of keys is unspecified, but in practice,
            // JavaScriptCore and V8 will serialize in the order added.
            return JSON.stringify(key);
        }
        catch (error) {
            return undefined;
        }
    };
    return SelectionSetCache;
}());
/**
 * Parsed a GraphQL AST selection into a tree of ParsedQueryNode instances.
 */
function parseQuery(context, fragments, selectionSet) {
    var variables = new Set();
    var visitedSelectionSets = new SelectionSetCache();
    var parsedQuery = _buildNodeMap(variables, context, fragments, visitedSelectionSets, selectionSet);
    if (!parsedQuery) {
        throw new Error("Parsed a query, but found no fields present; it may use unsupported GraphQL features");
    }
    return { parsedQuery: parsedQuery, variables: variables };
}
exports.parseQuery = parseQuery;
/**
 * Recursively builds a mapping of field names to ParsedQueryNodes for the given
 * selection set.
 */
function _buildNodeMap(variables, context, fragments, visitedSelectionSets, selectionSet, path) {
    if (path === void 0) { path = []; }
    if (!selectionSet)
        return undefined;
    var cachedQueryNode = visitedSelectionSets.get(selectionSet);
    if (cachedQueryNode)
        return cachedQueryNode;
    var nodeMap = Object.create(null);
    try {
        for (var _a = tslib_1.__values(selectionSet.selections), _b = _a.next(); !_b.done; _b = _a.next()) {
            var selection = _b.value;
            if (selection.kind === 'Field') {
                // The name of the field (as defined by the query).
                var name_1 = selection.alias ? selection.alias.value : selection.name.value;
                var children = _buildNodeMap(variables, context, fragments, visitedSelectionSets, selection.selectionSet, tslib_1.__spread(path, [name_1]));
                var args = void 0, schemaName = void 0;
                // fields marked as @static are treated as if they are a static field in
                // the schema.  E.g. parameters are ignored, and an alias is considered
                // to be truth.
                if (!util_1.fieldHasStaticDirective(selection)) {
                    args = _buildFieldArgs(variables, selection.arguments);
                    schemaName = selection.alias ? selection.name.value : undefined;
                }
                var hasParameterizedChildren = areChildrenDynamic(children);
                var nodeSelection = util_1.fieldHasInclusionDirective(selection) ? selection : undefined;
                var node = new ParsedQueryNode(children, schemaName, args, hasParameterizedChildren, nodeSelection);
                nodeMap[name_1] = _mergeNodes(tslib_1.__spread(path, [name_1]), node, nodeMap[name_1]);
            }
            else if (selection.kind === 'FragmentSpread') {
                var fragment = fragments[selection.name.value];
                if (!fragment) {
                    throw new Error("Expected fragment " + selection.name.value + " to be defined");
                }
                var fragmentMap = _buildNodeMap(variables, context, fragments, visitedSelectionSets, fragment.selectionSet, path);
                if (fragmentMap) {
                    for (var name_2 in fragmentMap) {
                        nodeMap[name_2] = _mergeNodes(tslib_1.__spread(path, [name_2]), fragmentMap[name_2], nodeMap[name_2]);
                    }
                }
            }
            else if (selection.kind === 'InlineFragment') {
                var fragmentMap = _buildNodeMap(variables, context, fragments, visitedSelectionSets, selection.selectionSet, path);
                if (fragmentMap) {
                    for (var name_3 in fragmentMap) {
                        nodeMap[name_3] = _mergeNodes(tslib_1.__spread(path, [name_3]), fragmentMap[name_3], nodeMap[name_3]);
                    }
                }
            }
            else if (context.tracer.warning) {
                context.tracer.warning(selection.kind + " selections are not supported; query may misbehave");
            }
            _collectDirectiveVariables(variables, selection);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var queryNode = Object.keys(nodeMap).length ? nodeMap : undefined;
    visitedSelectionSets.set(selectionSet, queryNode);
    return queryNode;
    var e_1, _c;
}
/**
 * Well, are they?
 */
function areChildrenDynamic(children) {
    if (!children)
        return undefined;
    for (var name_4 in children) {
        var child = children[name_4];
        if (child.hasParameterizedChildren)
            return true;
        if (child.args)
            return true;
        if (child.schemaName)
            return true; // Aliases are dynamic at read time.
    }
    return undefined;
}
exports.areChildrenDynamic = areChildrenDynamic;
/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildFieldArgs(variables, argumentsNode) {
    if (!argumentsNode)
        return undefined;
    var args = {};
    try {
        for (var argumentsNode_1 = tslib_1.__values(argumentsNode), argumentsNode_1_1 = argumentsNode_1.next(); !argumentsNode_1_1.done; argumentsNode_1_1 = argumentsNode_1.next()) {
            var arg = argumentsNode_1_1.value;
            // Mapped name of argument to it JS value
            args[arg.name.value] = _valueFromNode(variables, arg.value);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (argumentsNode_1_1 && !argumentsNode_1_1.done && (_a = argumentsNode_1.return)) _a.call(argumentsNode_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return Object.keys(args).length ? args : undefined;
    var e_2, _a;
}
/**
 * Evaluate a ValueNode and yield its value in its natural JS form.
 */
function _valueFromNode(variables, node) {
    return apollo_utilities_1.valueFromNode(node, function (_a) {
        var value = _a.name.value;
        variables.add(value);
        return new VariableArgument(value);
    });
}
/**
 * Collect the variables in use by any directives on the node.
 */
function _collectDirectiveVariables(variables, node) {
    var directives = node.directives;
    if (!directives)
        return;
    try {
        for (var directives_1 = tslib_1.__values(directives), directives_1_1 = directives_1.next(); !directives_1_1.done; directives_1_1 = directives_1.next()) {
            var directive = directives_1_1.value;
            if (!directive.arguments)
                continue;
            try {
                for (var _a = tslib_1.__values(directive.arguments), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var argument = _b.value;
                    apollo_utilities_1.valueFromNode(argument.value, function (_a) {
                        var value = _a.name.value;
                        variables.add(value);
                    });
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (directives_1_1 && !directives_1_1.done && (_d = directives_1.return)) _d.call(directives_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    var e_4, _d, e_3, _c;
}
/**
 * Merges two node definitions; mutating `target` to include children from
 * `source`.
 */
function _mergeNodes(path, target, source) {
    if (!source)
        return target;
    if (!apollo_utilities_1.isEqual(target.args, source.args)) {
        throw new errors_1.ConflictingFieldsError("parameterization mismatch", path, [target, source]);
    }
    if (target.schemaName !== source.schemaName) {
        throw new errors_1.ConflictingFieldsError("alias mismatch", path, [target, source]);
    }
    if (!source.children)
        return target;
    if (!target.children) {
        target.children = source.children;
    }
    else {
        for (var name_5 in source.children) {
            target.children[name_5] = _mergeNodes(tslib_1.__spread(path, [name_5]), source.children[name_5], target.children[name_5]);
        }
    }
    if (source.hasParameterizedChildren && !target.hasParameterizedChildren) {
        target.hasParameterizedChildren = true;
    }
    return target;
}
/**
 * Replace all instances of VariableArgument contained within a parsed operation
 * with their actual values.
 *
 * This requires that all variables used are provided in `variables`.
 */
function expandVariables(parsed, variables) {
    return _expandVariables(parsed, variables);
}
exports.expandVariables = expandVariables;
function _expandVariables(parsed, variables) {
    if (!parsed)
        return undefined;
    var newMap = {};
    for (var key in parsed) {
        var node = parsed[key];
        // TODO(jamesreggio): Eliminate unnecessary cast once explicit type can be
        // applied to `selection` property.
        var excluded = (node.selection && !apollo_utilities_1.shouldInclude(node.selection, variables))
            ? true : undefined;
        if (node.args || node.hasParameterizedChildren || excluded) {
            newMap[key] = new ParsedQueryNode(_expandVariables(node.children, variables), node.schemaName, expandFieldArguments(node.args, variables), node.hasParameterizedChildren, node.selection, excluded);
            // No variables to substitute for this subtree.
        }
        else {
            newMap[key] = node;
        }
    }
    return newMap;
}
exports._expandVariables = _expandVariables;
/**
 * Sub values in for any variables required by a field's args.
 */
function expandFieldArguments(args, variables) {
    return args ? _expandArgument(args, variables) : undefined;
}
exports.expandFieldArguments = expandFieldArguments;
function _expandArgument(arg, variables) {
    if (arg instanceof VariableArgument) {
        if (!variables || !(arg.name in variables)) {
            throw new Error("Expected variable $" + arg.name + " to exist for query");
        }
        return variables[arg.name];
    }
    else if (Array.isArray(arg)) {
        return arg.map(function (v) { return _expandArgument(v, variables); });
    }
    else if (util_1.isObject(arg)) {
        var expanded = {};
        for (var key in arg) {
            expanded[key] = _expandArgument(arg[key], variables);
        }
        return expanded;
    }
    else {
        // TS isn't inferring that arg cannot contain any VariableArgument values.
        return arg;
    }
}
exports._expandArgument = _expandArgument;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VkUXVlcnlOb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VkUXVlcnlOb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUF5RTtBQVN6RSxtQ0FBa0Q7QUFFbEQsK0JBQW9HO0FBS3BHOzs7Ozs7R0FNRztBQUNIO0lBQ0U7UUFDRSx3QkFBd0I7UUFDakIsUUFBd0M7UUFDL0M7Ozs7O1dBS0c7UUFDSSxVQUFtQjtRQUMxQiwyRUFBMkU7UUFDcEUsSUFBOEI7UUFDckM7OzthQUdLO1FBQ0Usd0JBQStCLEVBQy9CLFNBQWUsRUFBRSwwRUFBMEU7UUFDM0YsUUFBZTtRQWhCZixhQUFRLEdBQVIsUUFBUSxDQUFnQztRQU94QyxlQUFVLEdBQVYsVUFBVSxDQUFTO1FBRW5CLFNBQUksR0FBSixJQUFJLENBQTBCO1FBSzlCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBTztRQUMvQixjQUFTLEdBQVQsU0FBUyxDQUFNO1FBQ2YsYUFBUSxHQUFSLFFBQVEsQ0FBTztJQUNyQixDQUFDO0lBQ04sc0JBQUM7QUFBRCxDQUFDLEFBckJELElBcUJDO0FBckJZLDBDQUFlO0FBcUQ1Qjs7Ozs7O0dBTUc7QUFDSDtJQUNFO1FBQ0UsZ0NBQWdDO1FBQ2hCLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO0lBQzNCLENBQUM7SUFDTix1QkFBQztBQUFELENBQUMsQUFMRCxJQUtDO0FBTFksNENBQWdCO0FBTzdCOzs7Ozs7R0FNRztBQUNIO0lBQUE7UUFDVSxXQUFNLEdBQTRELEVBQUUsQ0FBQztJQXlCL0UsQ0FBQztJQXZCUSwrQkFBRyxHQUFWLFVBQVcsR0FBcUIsRUFBRSxLQUErQjtRQUMvRCxJQUFNLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdB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