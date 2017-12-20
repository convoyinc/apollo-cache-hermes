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
        hasParameterizedChildren, 
        /**
         * Whether the field is explicitly declared static via directive.
         */
        isStatic) {
        this.children = children;
        this.schemaName = schemaName;
        this.args = args;
        this.hasParameterizedChildren = hasParameterizedChildren;
        this.isStatic = isStatic;
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
 * Parsed a GraphQL AST selection into a tree of ParsedQueryNode instances.
 */
function parseQuery(context, fragments, selectionSet) {
    var variables = new Set();
    var parsedQuery = _buildNodeMap(variables, context, fragments, selectionSet);
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
function _buildNodeMap(variables, context, fragments, selectionSet, path) {
    if (path === void 0) { path = []; }
    if (!selectionSet)
        return undefined;
    var nodeMap = Object.create(null);
    try {
        for (var _a = tslib_1.__values(selectionSet.selections), _b = _a.next(); !_b.done; _b = _a.next()) {
            var selection = _b.value;
            if (selection.kind === 'Field') {
                // The name of the field (as defined by the query).
                var name_1 = selection.alias ? selection.alias.value : selection.name.value;
                var children = _buildNodeMap(variables, context, fragments, selection.selectionSet, tslib_1.__spread(path, [name_1]));
                var schemaName = selection.alias ? selection.name.value : undefined;
                var args = _buildFieldArgs(variables, selection.arguments);
                var isStatic = hasStaticDirective(selection);
                var hasParameterizedChildren = areChildrenDynamic(children);
                var node = new ParsedQueryNode(children, schemaName, args, hasParameterizedChildren, isStatic);
                nodeMap[name_1] = _mergeNodes(tslib_1.__spread(path, [name_1]), node, nodeMap[name_1]);
            }
            else if (selection.kind === 'FragmentSpread') {
                var fragment = fragments[selection.name.value];
                if (!fragment) {
                    throw new Error("Expected fragment " + selection.name.value + " to be defined");
                }
                var fragmentMap = _buildNodeMap(variables, context, fragments, fragment.selectionSet, path);
                if (fragmentMap) {
                    for (var name_2 in fragmentMap) {
                        nodeMap[name_2] = _mergeNodes(tslib_1.__spread(path, [name_2]), fragmentMap[name_2], nodeMap[name_2]);
                    }
                }
            }
            else if (selection.kind === 'InlineFragment') {
                var fragmentMap = _buildNodeMap(variables, context, fragments, selection.selectionSet, path);
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
    return Object.keys(nodeMap).length ? nodeMap : undefined;
    var e_1, _c;
}
/**
 * Determine whether a given node is explicitly marked as static.
 */
function hasStaticDirective(node) {
    var directives = node.directives;
    if (!directives)
        return undefined;
    if (directives.some(function (directive) { return directive.name.value === 'static'; }))
        return true;
    return undefined;
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
        if (!child.isStatic) {
            if (child.args)
                return true;
            if (child.schemaName)
                return true; // Aliases are dynamic at read time.
        }
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
        if (node.args || node.hasParameterizedChildren) {
            newMap[key] = new ParsedQueryNode(_expandVariables(node.children, variables), node.schemaName, expandFieldArguments(node.args, variables), node.hasParameterizedChildren, node.isStatic);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VkUXVlcnlOb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUGFyc2VkUXVlcnlOb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUEwRDtBQVMxRCxtQ0FBa0Q7QUFFbEQsK0JBQStDO0FBSy9DOzs7Ozs7R0FNRztBQUNIO0lBQ0U7UUFDRSx3QkFBd0I7UUFDakIsUUFBd0M7UUFDL0M7Ozs7O1dBS0c7UUFDSSxVQUFtQjtRQUMxQiwyRUFBMkU7UUFDcEUsSUFBOEI7UUFDckM7OzthQUdLO1FBQ0Usd0JBQStCO1FBQ3RDOztXQUVHO1FBQ0ksUUFBZTtRQWxCZixhQUFRLEdBQVIsUUFBUSxDQUFnQztRQU94QyxlQUFVLEdBQVYsVUFBVSxDQUFTO1FBRW5CLFNBQUksR0FBSixJQUFJLENBQTBCO1FBSzlCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBTztRQUkvQixhQUFRLEdBQVIsUUFBUSxDQUFPO0lBQ3JCLENBQUM7SUFDTixzQkFBQztBQUFELENBQUMsQUF2QkQsSUF1QkM7QUF2QlksMENBQWU7QUF1RDVCOzs7Ozs7R0FNRztBQUNIO0lBQ0U7UUFDRSxnQ0FBZ0M7UUFDaEIsSUFBWTtRQUFaLFNBQUksR0FBSixJQUFJLENBQVE7SUFDM0IsQ0FBQztJQUNOLHVCQUFDO0FBQUQsQ0FBQyxBQUxELElBS0M7QUFMWSw0Q0FBZ0I7QUFPN0I7O0dBRUc7QUFDSCxvQkFDRSxPQUFxQixFQUNyQixTQUFzQixFQUN0QixZQUE4QjtJQUU5QixJQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO0lBQ3BDLElBQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMvRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzRkFBc0YsQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFRCxN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