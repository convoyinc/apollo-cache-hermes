import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  ArgumentNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';

import { JsonScalar, NestedObject } from './primitive';
import { FragmentMap } from './util';

/**
 * Represent dynamic information: alias, parameterized arguments, directives
 * (if existed) of NodeSnapshot in GraphSnapshot.
 */
export class DynamicField {
  constructor(
    /** The map of arguments and their static or variable values. */
    public readonly args?: FieldArguments,
    /** A field name if exist an alias */
    public readonly fieldName?: string,
    /** Any children with dynamic fields. */
    public readonly children?: DynamicFieldMap,
  ) {}
}

export interface DynamicFieldWithArgs extends DynamicField {
  readonly args: FieldArguments;
}

/**
 * A recursive map where the keys indicate the path to any field in a result set
 * that contain a dynamic field.
 */
export interface DynamicFieldMap {
  [Key: string]: DynamicFieldMap | DynamicField;
}

/**
 * A mapping of argument names to their values.

 */
export type FieldArguments = NestedObject<JsonScalar | VariableArgument>;

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
 * Walks a selection set, identifying any dynamic fields within.
 *
 * TODO: Support for directives (maybe?).
 */
export function buildDynamicFieldMap(fragments: FragmentMap, selectionSet?: SelectionSetNode): DynamicFieldMap | undefined {
  if (!selectionSet) return undefined;

  let fieldMap;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to exist in GraphQL document`);
      }
      // TODO: Memoize.
      const fragmentEdges = buildDynamicFieldMap(fragments, fragment.selectionSet);
      if (fragmentEdges) {
        fieldMap = { ...fieldMap, ...fragmentEdges };
      }
    } else if (selection.kind === 'Field') {
      // if the current selection doesn't have any dynamic features but its
      // children do, we will host the DynamicFieldMap of the children directly
      // instead of creating indirect DynamicField with only children.  This
      // saves a bit of overhead, and allows us to more cleanly reason about
      // where dynamic fields are in the selection.
      const currentKey: string = selection.alias ? selection.alias.value : selection.name.value;
      let currentEdge: DynamicField | DynamicFieldMap | undefined;
      let parameterizedArguments: FieldArguments | undefined;

      if (selection.kind === 'Field' && selection.arguments && selection.arguments.length) {
        parameterizedArguments = _buildParameterizedEdgeArgs(selection.arguments);
      }

      // Is this a dynamic field?
      if (parameterizedArguments || selection.alias) {
        currentEdge = new DynamicField(parameterizedArguments,
          selection.alias ? selection.name.value : undefined,
          buildDynamicFieldMap(fragments, selection.selectionSet));
      } else if (selection.selectionSet) {
        currentEdge = buildDynamicFieldMap(fragments, selection.selectionSet);
      }

      if (currentEdge) {
        (fieldMap || (fieldMap = {}))[currentKey] = currentEdge;
      }
    }
    // TODO: inline fragments.
  }

  return fieldMap;
}

/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildParameterizedEdgeArgs(argumentsNode: ArgumentNode[]): FieldArguments {
  const args = {};
  for (const arg of argumentsNode) {
    // Mapped name of argument to it JS value
    args[arg.name.value] = _valueFromNode(arg.value);
  }

  return args;
}

/**
 * Evaluate a ValueNode and yield its value in its natural JS form.
 */
function _valueFromNode(node: ValueNode): any {
  switch (node.kind) {
  case 'Variable':
    return new VariableArgument(node.name.value);
  case 'NullValue':
    return null;
  case 'IntValue':
    return parseInt(node.value);
  case 'FloatValue':
    return parseFloat(node.value);
  case 'ListValue':
    return node.values.map(_valueFromNode);
  case 'ObjectValue': {
    const value = {};
    for (const field of node.fields) {
      value[field.name.value] = _valueFromNode(field.value);
    }
    return value;
  }
  default:
    return node.value;
  }
}

/**
 * Whether the edge is a DynamicEdgeWithParameterizedArguments
 */
export function isDynamicEdgeWithParameterizedArguments(edge: any): edge is DynamicFieldWithArgs {
  return !!(edge instanceof DynamicField && edge.args);
}

/**
 * Sub values in for any variables required by an edge's args.
 */
export function expandEdgeArguments(args: FieldArguments, variables: object = {}): object {
  const edgeArguments = {};
  // TODO: Recurse into objects/arrays.
  for (const key in args) {
    let arg = args[key];
    if (arg instanceof VariableArgument) {
      if (!(arg.name in variables)) {
        // TODO: Detect optional variables?
        throw new Error(`Expected variable $${arg.name} to exist for query`);
      }
      arg = variables[arg.name];
    }

    edgeArguments[key] = arg;
  }

  return edgeArguments;
}
