import { isEqual, valueFromNode } from 'apollo-utilities';
import { // eslint-disable-line import/no-extraneous-dependencies
  ArgumentNode,
  SelectionSetNode,
  SelectionNode,
  ValueNode,
} from 'graphql';

import { CacheContext } from './context';
import { ConflictingFieldsError } from './errors';
import { DeepReadonly, JsonScalar, JsonObject, JsonValue, NestedObject, NestedValue } from './primitive';
import { FragmentMap, isObject } from './util';

export type JsonAndVariables = JsonScalar | VariableArgument;
export type FieldArguments<TArgTypes = JsonScalar> = NestedObject<TArgTypes>;

/**
 * The GraphQL AST is parsed down into a simple tree containing all information
 * the cache requires to read/write associated payloads.
 *
 * A parsed query has no notion of fragments, or other such redirections; they
 * are flattened into query nodes when parsed.
 */
export class ParsedQueryNode<TArgTypes = JsonScalar> {
  constructor(
    /** Any child fields. */
    public children?: ParsedQueryNodeMap<TArgTypes>,
    /**
     * The name of the field (as defined by the schema).
     *
     * Omitted by default (can be inferred by its key in a node map), unless
     * the field is aliased.
     */
    public schemaName?: string,
    /** The map of the field's arguments and their values, if parameterized. */
    public args?: NestedObject<TArgTypes>,
    /**
     * Whether a (transitive) child contains arguments.  This allows us to
     * ignore whole subtrees in some situations if they were completely static.
     * */
    public hasParameterizedChildren?: true,
  ) {}
}

/**
 * A ParsedQueryNode that is known to have arguments.
 */
export interface ParsedQueryNodeWithArgs<TArgTypes = JsonScalar> extends ParsedQueryNode<TArgTypes> {
  args: NestedObject<TArgTypes>;
}

/**
 * Child nodes are expressed as a map of field names (as defined by the query)
 * mapped to their metadata.
 */
export interface ParsedQueryNodeMap<TArgTypes> {
  [key: string]: ParsedQueryNode<TArgTypes>;
}

/**
 * A parsed query is simply a map of top level fields and their descendants.
 */
export interface ParsedQuery<TArgTypes = JsonScalar> extends ParsedQueryNodeMap<TArgTypes> {}

/**
 * When we first parse a query, VariableArgument placeholders can exist in node
 * args.
 *
 * Queries given to the cache to read/write payloads must have values
 * substituted for any VariableArguments in the parsed query (and are a plain
 * ParsedQueryNode).
 */
export interface ParsedQueryWithVariables extends ParsedQuery<JsonAndVariables> {}

/**
 * Represents the location a variable should be used as an argument to a
 * parameterized field.
 *
 * Note that variables can occur _anywhere_ within an argument, not just at the
 * top level.
 */
export class VariableArgument {
  constructor(
    /** The name of the variable. */
    public readonly name: string,
  ) {}
}

/**
 * Parsed a GraphQL AST selection into a tree of ParsedQueryNode instances.
 */
export function parseQuery(
  context: CacheContext,
  fragments: FragmentMap,
  selectionSet: SelectionSetNode,
): { parsedQuery: DeepReadonly<ParsedQueryWithVariables>, variables: Set<string> } {
  const variables = new Set<string>();
  const parsedQuery = _buildNodeMap(variables, context, fragments, selectionSet);
  if (!parsedQuery) {
    throw new Error(`Parsed a query, but found no fields present; it may use unsupported GraphQL features`);
  }

  return { parsedQuery, variables };
}

/**
 * Recursively builds a mapping of field names to ParsedQueryNodes for the given
 * selection set.
 */
function _buildNodeMap(
  variables: Set<string>,
  context: CacheContext,
  fragments: FragmentMap,
  selectionSet?: SelectionSetNode,
  path: string[] = [],
): ParsedQueryWithVariables | undefined {
  if (!selectionSet) return undefined;

  const nodeMap = Object.create(null);
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      // The name of the field (as defined by the query).
      const name = selection.alias ? selection.alias.value : selection.name.value;
      const children = _buildNodeMap(variables, context, fragments, selection.selectionSet, [...path, name]);
      const schemaName = selection.alias ? selection.name.value : undefined;
      const args = _buildFieldArgs(variables, selection.arguments);
      const hasParameterizedChildren = areChildrenDynamic(children);

      const node = new ParsedQueryNode(children, schemaName, args, hasParameterizedChildren);
      nodeMap[name] = _mergeNodes([...path, name], node, nodeMap[name]);

    } else if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to be defined`);
      }

      const fragmentMap = _buildNodeMap(variables, context, fragments, fragment.selectionSet, path);
      if (fragmentMap) {
        for (const name in fragmentMap) {
          nodeMap[name] = _mergeNodes([...path, name], fragmentMap[name], nodeMap[name]);
        }
      }

    } else if (context.tracer.warning) {
      context.tracer.warning(`${selection.kind} selections are not supported; query may misbehave`);
    }

    _collectDirectiveVariables(variables, selection);
  }

  return Object.keys(nodeMap).length ? nodeMap : undefined;
}

/**
 * Well, are they?
 */
export function areChildrenDynamic(children?: ParsedQueryWithVariables) {
  if (!children) return undefined;
  for (const name in children) {
    const child = children[name];
    if (child.hasParameterizedChildren) return true;
    if (child.args) return true;
    if (child.schemaName) return true; // Aliases are dynamic at read time.
  }
  return undefined;
}

/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildFieldArgs(variables: Set<string>, argumentsNode?: ArgumentNode[]) {
  if (!argumentsNode) return undefined;

  const args = {};
  for (const arg of argumentsNode) {
    // Mapped name of argument to it JS value
    args[arg.name.value] = _valueFromNode(variables, arg.value);
  }

  return Object.keys(args).length ? args : undefined;
}

/**
 * Evaluate a ValueNode and yield its value in its natural JS form.
 */
function _valueFromNode(variables: Set<string>, node: ValueNode): JsonValue {
  return valueFromNode(node, ({ name: { value } }) => {
    variables.add(value);
    return new VariableArgument(value);
  });
}

/**
 * Collect the variables in use by any directives on the node.
 */
function _collectDirectiveVariables(variables: Set<string>, node: SelectionNode) {
  const { directives } = node;
  if (!directives) return;

  for (const directive of directives) {
    if (!directive.arguments) continue;

    for (const argument of directive.arguments) {
      valueFromNode(argument.value, ({ name: { value } }) => {
        variables.add(value);
      });
    }
  }
}

/**
 * Merges two node definitions; mutating `target` to include children from
 * `source`.
 */
function _mergeNodes<TArgTypes>(path: string[], target: ParsedQueryNode<TArgTypes>, source?: ParsedQueryNode<TArgTypes>) {
  if (!source) return target;
  if (!isEqual(target.args, source.args)) {
    throw new ConflictingFieldsError(`parameterization mismatch`, path, [target, source]);
  }
  if (target.schemaName !== source.schemaName) {
    throw new ConflictingFieldsError(`alias mismatch`, path, [target, source]);
  }
  if (!source.children) return target;

  if (!target.children) {
    target.children = source.children;
  } else {
    for (const name in source.children) {
      target.children[name] = _mergeNodes([...path, name], source.children[name], target.children[name]);
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
export function expandVariables(parsed: ParsedQueryWithVariables, variables: JsonObject | undefined): ParsedQuery {
  return _expandVariables(parsed, variables)!;
}

export function _expandVariables(parsed?: ParsedQueryWithVariables, variables?: JsonObject) {
  if (!parsed) return undefined;

  const newMap = {};
  for (const key in parsed) {
    const node = parsed[key];
    if (node.args || node.hasParameterizedChildren) {
      newMap[key] = new ParsedQueryNode(
        _expandVariables(node.children, variables),
        node.schemaName,
        expandFieldArguments(node.args, variables),
        node.hasParameterizedChildren,
      );
    // No variables to substitute for this subtree.
    } else {
      newMap[key] = node;
    }
  }

  return newMap;
}

/**
 * Sub values in for any variables required by a field's args.
 */
export function expandFieldArguments(
  args: NestedValue<JsonAndVariables> | undefined,
  variables: JsonObject | undefined,
): JsonObject | undefined {
  return args ? _expandArgument(args, variables) as JsonObject : undefined;
}

export function _expandArgument(
  arg: NestedValue<JsonAndVariables>,
  variables: JsonObject | undefined,
): JsonValue {
  if (arg instanceof VariableArgument) {
    if (!variables || !(arg.name in variables)) {
      throw new Error(`Expected variable $${arg.name} to exist for query`);
    }
    return variables[arg.name];
  } else if (Array.isArray(arg)) {
    return arg.map(v => _expandArgument(v, variables));
  } else if (isObject(arg)) {
    const expanded = {};
    for (const key in arg) {
      expanded[key] = _expandArgument(arg[key], variables);
    }
    return expanded;
  } else {
    // TS isn't inferring that arg cannot contain any VariableArgument values.
    return arg as JsonValue;
  }
}
