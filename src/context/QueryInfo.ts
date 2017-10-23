import { // eslint-disable-line import/no-extraneous-dependencies
  DocumentNode,
  OperationDefinitionNode,
  OperationTypeNode,
} from 'graphql';

import { ParsedQueryWithVariables, parseQuery } from '../ParsedQueryNode';
import { JsonValue } from '../primitive';
import {
  FragmentMap,
  fragmentMapForDocument,
  getOperationOrDie,
  variableDefaultsInOperation,
  variablesInOperation,
} from '../util';

import { CacheContext } from './CacheContext';

/**
 * Metadata about a GraphQL document (query/mutation/fragment/etc).
 *
 * We do a fair bit of pre-processing over them, and these objects hang onto
 * that information.
 */
export class QueryInfo {

  /** The original document (after __typename fields are injected). */
  public readonly document: DocumentNode;
  /** The primary operation in the document. */
  public readonly operation: OperationDefinitionNode;
  /** The type of operation. */
  public readonly operationType: OperationTypeNode;
  /** The name of the operation. */
  public readonly operationName?: string;
  /** The GQL source of the operation */
  public readonly operationSource?: string;
  /** All fragments in the document, indexed by name. */
  public readonly fragmentMap: FragmentMap;
  /**
   * The fully parsed query document.  It will be flattened (no fragments),
   * and contain placeholders for any variables in use.
   */
  public readonly parsed: ParsedQueryWithVariables;
  /** Variables used within this query. */
  public readonly variables: Set<string>;
  /**
   * Default values for the variables used by this query.
   *
   * Variables not present in this map are considered required.
   */
  public readonly variableDefaults: { [Key: string]: JsonValue }

  constructor(context: CacheContext, document: DocumentNode) {
    this.document = document;
    this.operation = getOperationOrDie(document);
    this.operationType = this.operation.operation;
    this.operationName = this.operation.name && this.operation.name.value;
    this.operationSource = this.operation.loc && this.operation.loc.source.body;
    this.fragmentMap = fragmentMapForDocument(document);

    const { parsedQuery, variables } = parseQuery(context, this.fragmentMap, this.operation.selectionSet);
    this.parsed = parsedQuery;
    this.variables = variables;
    this.variableDefaults = variableDefaultsInOperation(this.operation);

    this._assertValid();
  }

  private _assertValid() {
    const messages: string[] = [];

    const declaredVariables = variablesInOperation(this.operation);
    this._assertAllVariablesDeclared(messages, declaredVariables);
    this._assertAllVariablesUsed(messages, declaredVariables);

    if (!messages.length) return;
    const mainMessage = `Validation errors in ${this.operationType} ${this.operationName || '<unknown>'}`;
    throw new Error(`${mainMessage}:${messages.map(m => `\n * ${m}`).join('')}`);
  }

  private _assertAllVariablesDeclared(messages: string[], declaredVariables: Set<string>) {
    for (const name of this.variables) {
      if (!declaredVariables.has(name)) {
        messages.push(`Variable $${name} is used, but not declared`);
      }
    }
  }

  private _assertAllVariablesUsed(messages: string[], declaredVariables: Set<string>) {
    for (const name of declaredVariables) {
      if (!this.variables.has(name)) {
        messages.push(`Variable $${name} is unused`);
      }
    }
  }

}
