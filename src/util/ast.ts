import lodashCloneDeep = require('lodash.clonedeep');
import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  ArgumentNode,
  DocumentNode,
  DefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';

import { JsonScalar } from '../primitive';

/**
 * String enum of GraphQL AST Node.
 * NOTE: this list is NOT complete and only include node _kind_ we use
 */
export enum GraphqlNodeKind {
  Field = 'Field',
  FragmentSpread = 'FragmentSpread',
  FragmentDefinition = 'FragmentDefinition',
  InlineFragment = 'InlineFragment',
  Name = 'Name',
  OperationDefinition = 'OperationDefinition',
}

/**
 * Extracts the query operation from `document`.
 */
export function getOperationOrDie(document: DocumentNode): OperationDefinitionNode {
  const operations = document.definitions.filter(d => d.kind === 'OperationDefinition') as OperationDefinitionNode[];
  if (!operations.length) {
    throw new Error(`GraphQL document is missing am operation`);
  }
  if (operations.length > 1) {
    throw new Error(`Ambiguous GraphQL document: contains ${operations.length} operations`);
  }

  return operations[0];
}

export interface FragmentMap {
  [Key: string]: FragmentDefinitionNode,
}

/**
 * Extracts fragments from `document` by name.
 */
export function fragmentMapForDocument(document: DocumentNode): FragmentMap {
  const map: FragmentMap = {};
  for (const definition of document.definitions) {
    if (definition.kind !== GraphqlNodeKind.FragmentDefinition) continue;
    map[definition.name.value] = definition;
  }

  return map;
}

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

/**
 * A recursive map where the keys indicate the path to any edge in a result set
 * that contain a parameterized edge.
 */
export interface DynamicEdgeMap {
  [Key: string]: DynamicEdgeMap | DynamicEdge;
}

/**
 * A value that can be expressed as an argument of a parameterized edge.
 */
export type EdgeArgumentScalar = JsonScalar | VariableArgument;
export interface EdgeArgumentArray extends Array<ParameterizedEdgeArgumentValue> {}
export interface ParameterizedEdgeArguments { [argumentName: string]: ParameterizedEdgeArgumentValue }
export type ParameterizedEdgeArgumentValue = EdgeArgumentScalar | EdgeArgumentArray | ParameterizedEdgeArguments;

/**
 * Represent dynamic information: alias, parameterized arguments,
 * directives (if existed) of NodeSnapshot in GraphSnapshot.
 */
export class DynamicEdge {
  constructor(
    /** The map of arguments and their static or variable values. */
    public readonly parameterizedEdgeArgs?: ParameterizedEdgeArguments,
    /** A field name if exist an alias */
    public readonly fieldName?: string,
    /** Any child edge maps. */
    public readonly children?: DynamicEdgeMap,
  ) {}
}

/**
 * Walks a selection set, identifying the path to all parameterized edges.
 *
 * TODO: Support for directives (maybe?).
 */
export function buildParameterizedEdgeMap(fragments: FragmentMap, selectionSet?: SelectionSetNode): DynamicEdgeMap | undefined {
  if (!selectionSet) return undefined;

  let edgeMap;

  for (const selection of selectionSet.selections) {
    let key, value;

    // Parameterized edge.
    if (selection.kind === GraphqlNodeKind.Field && selection.arguments && selection.arguments.length) {
      const parameterizedArguments = _buildParameterizedEdgeArgs(selection.arguments);
      const children = buildParameterizedEdgeMap(fragments, selection.selectionSet);

      key = selection.name.value;
      value = new DynamicEdge(parameterizedArguments, /*fieldName*/ undefined, children);

    // We need to walk any simple fields that have selection sets of their own.
    } else if (selection.kind === GraphqlNodeKind.Field && selection.selectionSet) {
      value = buildParameterizedEdgeMap(fragments, selection.selectionSet);
      if (value) {
        key = selection.name.value;
      }

    // Fragments may include parameterized edges of their own; walk 'em.
    } else if (selection.kind === GraphqlNodeKind.FragmentSpread) {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to exist in GraphQL document`);
      }
      // TODO: Memoize.
      const fragmentEdges = buildParameterizedEdgeMap(fragments, fragment.selectionSet);
      if (fragmentEdges) {
        edgeMap = { ...edgeMap, ...fragmentEdges };
      }
    }

    // TODO: inline fragments.

    if (key) {
      edgeMap = edgeMap || {};
      edgeMap[key] = value;
    }
  }

  return edgeMap;
}

/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildParameterizedEdgeArgs(argumentsNode: ArgumentNode[]) {
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
 * Sub values in for any variables required by an edge's args.
 */
export function expandEdgeArguments(edge: DynamicEdge, variables: object = {}): object {
  const edgeArguments = {} as any;
  // TODO: Recurse into objects/arrays.
  for (const key in edge.parameterizedEdgeArgs!) {
    let arg = edge.parameterizedEdgeArgs![key];
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

// The following are borrowed directly from apollo-client:

const TYPENAME_FIELD: FieldNode = {
  kind: GraphqlNodeKind.Field,
  name: {
    kind: GraphqlNodeKind.Name,
    value: '__typename',
  },
};

function addTypenameToSelectionSet(
  selectionSet: SelectionSetNode,
  isRoot = false,
) {
  if (selectionSet.selections) {
    if (!isRoot) {
      const alreadyHasThisField = selectionSet.selections.some((selection) => {
        return selection.kind === GraphqlNodeKind.Field && selection.name.value === '__typename';
      });

      if (!alreadyHasThisField) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }

    selectionSet.selections.forEach((selection) => {
      // Must not add __typename if we're inside an introspection query
      if (selection.kind === GraphqlNodeKind.Field) {
        if (
          selection.name.value.lastIndexOf('__', 0) !== 0 &&
          selection.selectionSet
        ) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      } else if (selection.kind === GraphqlNodeKind.InlineFragment) {
        if (selection.selectionSet) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      }
    });
  }
}

export function addTypenameToDocument(doc: DocumentNode) {
  const docClone = lodashCloneDeep(doc);

  docClone.definitions.forEach((definition: DefinitionNode) => {
    addTypenameToSelectionSet(
      (definition as OperationDefinitionNode).selectionSet,
      /* isRoot*/ definition.kind === GraphqlNodeKind.OperationDefinition,
    );
  });

  return docClone;
}
