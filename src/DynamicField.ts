import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  ArgumentNode,
  SelectionSetNode,
  ValueNode,
} from 'graphql';

import { JsonObject, JsonScalar, JsonValue, NestedObject, NestedValue } from './primitive';
import { FragmentMap, isObject, valueFromNode } from './util';

export type JsonAndArgs = JsonScalar | VariableArgument;

/**
 * Represent dynamic information: alias, parameterized arguments, directives
 * (if existed) of NodeSnapshot in GraphSnapshot.
 */
export class DynamicField<TArgTypes = JsonScalar, TChildArgTypes = JsonScalar> {
  constructor(
    /** The map of arguments and their static or variable values. */
    public readonly args?: NestedObject<TArgTypes>,
    /** A field name if exist an alias */
    public readonly fieldName?: string,
    /** Any children with dynamic fields. */
    public readonly children?: DynamicFieldMap<TChildArgTypes>,
  ) {}
}
export interface DynamicFieldWithVariables extends DynamicField<JsonAndArgs, JsonAndArgs> {}
export interface DynamicFieldWithArgs extends DynamicField {
  readonly args: NestedObject<JsonScalar>;
}

/**
 * A recursive map where the keys indicate the path to any field in a result set
 * that contain a dynamic field.
 */
export interface DynamicFieldMap<TArgTypes = JsonScalar> {
  [Key: string]: DynamicFieldMap<TArgTypes> | DynamicField<TArgTypes, TArgTypes>;
}
export interface DynamicFieldMapWithVariables extends DynamicFieldMap<JsonAndArgs> {}

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
export function compileDynamicFields(fragments: FragmentMap, selectionSet?: SelectionSetNode) {
  const variables = new Set<string>();
  const fieldMap = _buildDynamicFieldMap(variables, fragments, selectionSet);

  return { variables, fieldMap };
}

function _buildDynamicFieldMap(
  variables: Set<string>,
  fragments: FragmentMap,
  selectionSet?: SelectionSetNode,
): DynamicFieldMapWithVariables | undefined {
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
      let currentField: DynamicFieldWithVariables | DynamicFieldMapWithVariables | undefined;
      let parameterizedArguments: NestedObject<JsonAndArgs> | undefined;

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
function _buildFieldArgs(variables: Set<string>, argumentsNode: ArgumentNode[]): NestedObject<JsonAndArgs> {
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
function _valueFromNode(variables: Set<string>, node: ValueNode): JsonValue {
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

export function deprecatedExpandVariables(
  map: DynamicFieldMapWithVariables | undefined,
  variables: JsonObject | undefined,
): DynamicFieldMap | undefined {
  if (!map) return undefined;

  const newMap = {};
  for (const key in map) {
    const entry = map[key];
    if (entry instanceof DynamicField) {
      newMap[key] = new DynamicField(
        expandFieldArguments(entry.args, variables),
        entry.fieldName,
        deprecatedExpandVariables(entry.children, variables),
      );
    } else {
      newMap[key] = deprecatedExpandVariables(entry, variables);
    }
  }

  return newMap;
}

/**
 * Sub values in for any variables required by a field's args.
 */
export function expandFieldArguments(
  args: NestedValue<JsonAndArgs> | undefined,
  variables: JsonObject | undefined,
): JsonObject | undefined {
  return args ? _expandArgument(args, variables) as JsonObject : undefined;
}

export function _expandArgument(
  arg: NestedValue<JsonAndArgs>,
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
