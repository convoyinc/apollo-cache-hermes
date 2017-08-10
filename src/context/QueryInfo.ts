import { DocumentNode } from 'graphql'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved

import { ParameterizedEdgeMap, parameterizedEdgesForOperation } from '../util';

/**
 * Metadata about a GraphQL document (query/mutation/fragment/etc).
 *
 * We do a fair bit of pre-processing over them, and these objects hang onto
 * that information.
 */
export class QueryInfo {

  /** The original document (after __typename fields are injected). */
  public readonly document: DocumentNode;
  /** The edge map for the document, if there are any parameterized edges. */
  public readonly parameterizedEdgeMap?: ParameterizedEdgeMap;

  constructor(document: DocumentNode) {
    this.document = document;
    this.parameterizedEdgeMap = parameterizedEdgesForOperation(document);
  }

}
