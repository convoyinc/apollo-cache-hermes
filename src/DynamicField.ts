import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  ArgumentNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';

import { JsonScalar } from './primitive';
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
    /** Any child edge maps. */
    public readonly children?: DynamicFieldMap,
  ) {}
}

export type DynamicFieldWithParameterizedArguments = DynamicField & { args: FieldArguments };

/**
 * A recursive map where the keys indicate the path to any edge in a result set
 * that contain a parameterized edge.
 */
export interface DynamicFieldMap {
  [Key: string]: DynamicFieldMap | DynamicField;
}

/**
 * A value that can be expressed as an argument of a parameterized edge.
 */
export type EdgeArgumentScalar = JsonScalar | VariableArgument;
export interface EdgeArgumentArray extends Array<ParameterizedEdgeArgumentValue> {}
export interface FieldArguments { [argumentName: string]: ParameterizedEdgeArgumentValue }
export type ParameterizedEdgeArgumentValue = EdgeArgumentScalar | EdgeArgumentArray | FieldArguments;

/**
 * Represents the location a variable should be used as an argument to a
 * parameterized edge.
 */
export class VariableArgument {
  constructor(
    /** The name of the variable. */
    public readonly name: string,
  ) {}
}

export const foo: FieldArguments = {
  asdf: [new VariableArgument('asdf')],
  fdsa: {
    one: {
      two: [123, new VariableArgument('foo')],
    },
  },
};

/**
 * Walks a selection set, identifying the path to any dynamic edges
 * which are alias, parameterized arguments, directives
 * TODO: Support for directives (maybe?).
 */
export function buildDynamicFieldMap(fragments: FragmentMap, selectionSet?: SelectionSetNode): DynamicFieldMap | undefined {
  if (!selectionSet) return undefined;

  let edgeMap;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to exist in GraphQL document`);
      }
      // TODO: Memoize.
      const fragmentEdges = buildDynamicFieldMap(fragments, fragment.selectionSet);
      if (fragmentEdges) {
        edgeMap = { ...edgeMap, ...fragmentEdges };
      }
    } else if (selection.kind === 'Field') {
      // if the current selection doesn't have any dynamic features
      // but its children have dynamic features, we will host the DynamicEdgeMap
      // of the chidren directly instead of creating indirect DynamicField with
      // children. This is to save resources in walking
      const currentKey: string = selection.alias ? selection.alias.value : selection.name.value;
      let currentEdge: DynamicField | DynamicFieldMap | undefined;
      let parameterizedArguments: FieldArguments | undefined;

      if (selection.kind === 'Field' && selection.arguments && selection.arguments.length) {
        parameterizedArguments = _buildParameterizedEdgeArgs(selection.arguments);
      }

      // If current selection has either parameterized arguments or alias, we
      // will want to create dynamic edge. Otherwise recurse into the children.
      if (parameterizedArguments || selection.alias) {
        currentEdge = new DynamicField(parameterizedArguments,
          selection.alias ? selection.name.value : undefined,
          buildDynamicFieldMap(fragments, selection.selectionSet));
      } else if (selection.selectionSet) {
        currentEdge = buildDynamicFieldMap(fragments, selection.selectionSet);
      }

      if (currentEdge) {
        (edgeMap || (edgeMap = {}))[currentKey] = currentEdge;
      }
    }
    // TODO: inline fragments.
  }

  return edgeMap;
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
export function isDynamicEdgeWithParameterizedArguments(edge: any): edge is DynamicFieldWithParameterizedArguments {
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
