import { PathPart } from '../primitive';

export type Visitor = (
  path: PathPart[],
  payloadValue: any,
  nodeValue: any,
  // TODO: Walk for parameterized edges.
) => void | boolean;

/**
 * Specialized node walker for payloads/nodes/selections when merging.
 *
 * TODO: May want something more generic.
 */
export function walkPayload(payload: any, node: any, visitor: Visitor) {

}
