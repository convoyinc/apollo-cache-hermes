import { // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
  DocumentNode,
  OperationDefinitionNode,
} from 'graphql';

import { DynamicEdgeMap, buildDynamicEdgeMap } from '../DynamicField';
import { FragmentMap, fragmentMapForDocument, getOperationOrDie } from '../util';

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
  /** The name of the operation. */
  public readonly operationName?: string;
  /** All fragments in the document, indexed by name. */
  public readonly fragmentMap: FragmentMap;
  /** The edge map for the document, if there are any dynamic features:
   *    alias, parameterized arguments, directive
   */
  public readonly dynamicEdgeMap?: DynamicEdgeMap;

  constructor(document: DocumentNode) {
    this.document = document;
    this.operation = getOperationOrDie(document);
    this.operationName = this.operation.name && this.operation.name.value;
    this.fragmentMap = fragmentMapForDocument(document);
    this.dynamicEdgeMap = buildDynamicEdgeMap(this.fragmentMap, this.operation.selectionSet);
  }

}
