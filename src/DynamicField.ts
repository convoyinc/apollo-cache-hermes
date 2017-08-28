import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  ArgumentNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';

import { JsonScalar, NestedObject } from './primitive';
import { FragmentMap, valueFromNode } from './util';

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
export function buildDynamicFieldMap(fragments: FragmentMap, selectionSet?: SelectionSetNode) {
  const variables = new Set<string>();
  const fieldMap = _buildDynamicFieldMap(variables, fragments, selectionSet);

  return { variables, fieldMap };
}

export function _buildDynamicFieldMap(
  variables: Set<string>,
  fragments: FragmentMap,
  selectionSet?: SelectionSetNode,
): DynamicFieldMap | undefined {
  if (!selectionSet) return undefined;

  let fieldMap;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (!fragment) {
        throw new Error(`Expected fragment ${selection.name.value} to exist in GraphQL document`);
      }
      // TODO: Memoize.
      const fragmentFields = _buildDynamicFieldMap(variables, fragments, fragment.selectionSet);
      if (fragmentFields) {
        fieldMap = { ...fieldMap, ...fragmentFields };
      }
    } else if (selection.kind === 'Field') {
      // if the current selection doesn't have any dynamic features but its
      // children do, we will host the DynamicFieldMap of the children directly
      // instead of creating indirect DynamicField with only children.  This
      // saves a bit of overhead, and allows us to more cleanly reason about
      // where dynamic fields are in the selection.
      const currentKey: string = selection.alias ? selection.alias.value : selection.name.value;
      let currentField: DynamicField | DynamicFieldMap | undefined;
      let parameterizedArguments: FieldArguments | undefined;

      if (selection.kind === 'Field' && selection.arguments && selection.arguments.length) {
        parameterizedArguments = _buildFieldArgs(variables, selection.arguments);
      }

      // Is this a dynamic field?
      if (parameterizedArguments || selection.alias) {
        currentField = new DynamicField(parameterizedArguments,
          selection.alias ? selection.name.value : undefined,
          _buildDynamicFieldMap(variables, fragments, selection.selectionSet));
      } else if (selection.selectionSet) {
        currentField = _buildDynamicFieldMap(variables, fragments, selection.selectionSet);
      }

      if (currentField) {
        (fieldMap || (fieldMap = {}))[currentKey] = currentField;
      }
    }
    // TODO: inline fragments.
  }

  return fieldMap;
}

/**
 * Build the map of arguments to their natural JS values (or variables).
 */
function _buildFieldArgs(variables: Set<string>, argumentsNode: ArgumentNode[]): FieldArguments {
  const args = {};
  for (const arg of argumentsNode) {
    // Mapped name of argument to it JS value
    args[arg.name.value] = _valueFromNode(variables, arg.value);
  }

  return args;
}

/**
 * Evaluate a ValueNode and yield its value in its natural JS form.
 */
function _valueFromNode(variables: Set<string>, node: ValueNode): any {
  return valueFromNode(node, ({ name: { value } }) => {
    variables.add(value);
    return new VariableArgument(value);
  });
}

/**
 * Whether the field is a DynamicFieldWithParameterizedArguments
 */
export function isDynamicFieldWithArgs(field: any): field is DynamicFieldWithArgs {
  return !!(field instanceof DynamicField && field.args);
}

/**
 * Sub values in for any variables required by a field's args.
 */
export function expandFieldArguments(args: FieldArguments, variables: object = {}): object {
  const expanded = {};
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

    expanded[key] = arg;
  }

  return expanded;
}

/**
 *
 */
export function variablesInDynamicFieldMap(fieldMap: DynamicFieldMap): Set<string> {
  const names = new Set<string>();

  return names;
}