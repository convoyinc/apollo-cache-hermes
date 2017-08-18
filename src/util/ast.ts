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
 * Extracts the query operation from `document`.
 */
export function getOperationOrDie(document: DocumentNode): OperationDefinitionNode {
  const operations = document.definitions.filter(d => d.kind === GraphqlNodeKind.OperationDefinition) as OperationDefinitionNode[];
  if (!operations.length) {
    throw new Error(`GraphQL document is missing am operation`);
  }
  if (operations.length > 1) {
    throw new Error(`Ambiguous GraphQL document: contains ${operations.length} operations`);
  }

  return operations[0];
}

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

export enum GraphqlValueNodeKind {
  BooleanValue = 'BooleanValue',
  EnumValue = 'EnumValue',
  FloatValue = 'FloatValue',
  IntValue = 'IntValue',
  ListValue = 'ListValue',
  NullValue = 'NullValue',
  ObjectValue = 'ObjectValue',
  StringValue = 'StringValue',
  Variable = 'Variable',
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
 * A value that can be expressed as an argument of a parameterized edge.
 */
export type EdgeArgumentScalar = JsonScalar | VariableArgument;
export interface EdgeArgumentArray extends Array<EdgeArgument> {}
export interface EdgeParameterizedArgumentObject { [Key: string]: EdgeArgument }
export type EdgeArgument = EdgeArgumentScalar | EdgeArgumentArray | EdgeParameterizedArgumentObject;

/**
 * Represents a parameterized edge (within an edge map).
 */
export class Edge {
  constructor(
    /** The map of arguments and their static or variable values. */
    public readonly parameterizedArguments?: EdgeParameterizedArgumentObject,
    /** Any child edge maps. */
    public readonly children?: EdgeMap,
  ) {}
}

export interface FieldAliasMap {
  [key: string]: string
}
/**
 * A recursive map where the keys indicate the path to any edge in a result set
 * that contain a parameterized edge.
 */
export interface EdgeMap {
  fieldAliases?: FieldAliasMap;
  [key: string]: EdgeMap | Edge | FieldAliasMap | undefined;
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
 * Walks a selection set, identifying the path to all parameterized edges.
 *
 * TODO: Support for directives (maybe?).
 */
export function buildEdgeMap(fragments: FragmentMap, selectionSet: SelectionSetNode | undefined): EdgeMap | undefined {
  if (!selectionSet) return undefined;

  let edgeMap;
  let fieldAliases: FieldAliasMap | undefined = undefined;

  for (const selection of selectionSet.selections) {
    let edgeMapValue: Edge | EdgeMap | undefined;
    if (selection.kind === GraphqlNodeKind.Field) {
      // The selection itself is paremeterized
      const parameterizedArguments = selection.arguments && selection.arguments.length ?
        _buildParameterizedEdgeArgs(selection.arguments) : undefined;

      if (selection.alias) {
        (fieldAliases || (fieldAliases = Object.create(null)))[selection.alias.value] = selection.name.value;
      }

      if (parameterizedArguments) {
        edgeMapValue = new Edge(parameterizedArguments, selection.selectionSet ? buildEdgeMap(fragments, selection.selectionSet) : undefined);
      }
      else if (selection.selectionSet) {
        edgeMapValue = buildEdgeMap(fragments, selection.selectionSet);
      }
    } else if (selection.kind === GraphqlNodeKind.FragmentSpread) {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to exist in GraphQL document`);
      }
      // TODO: Memoize.
      const fragmentEdges = buildEdgeMap(fragments, fragment.selectionSet);
      if (fragmentEdges) {
        edgeMap = { ...edgeMap, ...fragmentEdges };
      }
    }
    // TODO: inline fragments.
    if (edgeMapValue) {
      edgeMap = edgeMap || Object.create(null);
      edgeMap[(selection as FieldNode).name.value] = edgeMapValue;
    }
  }
  if (fieldAliases) {
    (edgeMap || (edgeMap = Object.create(null))).fieldAliases = fieldAliases;
  }

  return edgeMap;
}

/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildParameterizedEdgeArgs(argumentsNode: ArgumentNode[]): EdgeParameterizedArgumentObject {
  const args: EdgeParameterizedArgumentObject = {};
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
    case GraphqlValueNodeKind.Variable:
      return new VariableArgument(node.name.value);
    case GraphqlValueNodeKind.NullValue:
      return null;
    case GraphqlValueNodeKind.IntValue:
      return parseInt(node.value);
    case GraphqlValueNodeKind.FloatValue:
      return parseFloat(node.value);
    case GraphqlValueNodeKind.ListValue:
      return node.values.map(_valueFromNode);
    case GraphqlValueNodeKind.ObjectValue:
      const value = {};
      for (const field of node.fields) {
        value[field.name.value] = _valueFromNode(field.value);
      }
      return value;
    case GraphqlValueNodeKind.BooleanValue:
    case GraphqlValueNodeKind.StringValue:
    case GraphqlValueNodeKind.EnumValue:
      return node.value
  }
}

/**
 * Sub values in for any variables required by an edge's args.
 */
export function expandEdgeArguments(edgeParameterizedArguments: EdgeParameterizedArgumentObject, variables: object = {}) {
  const edgeArguments: { [key in keyof EdgeParameterizedArgumentObject]: any } = {};
  // TODO: Recurse into objects/arrays.
  for (const key in edgeParameterizedArguments) {
    let arg = edgeParameterizedArguments[key];
    if (arg instanceof VariableArgument) {
      if (!(variables.hasOwnProperty(arg.name))) {
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

function addTypenameToSelectionSet(selectionSet: SelectionSetNode, isRoot = false) {
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

  docClone.definitions.forEach((definition: OperationDefinitionNode | FragmentDefinitionNode) => {
    addTypenameToSelectionSet(definition.selectionSet, definition.kind === GraphqlNodeKind.OperationDefinition);
  });

  return docClone;
}