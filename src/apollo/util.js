"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_utilities_1 = require("apollo-utilities");
var schema_1 = require("../schema");
/**
 * Builds a query.
 */
function buildRawOperationFromQuery(document, variables, rootId) {
    return {
        rootId: rootId || schema_1.StaticNodeId.QueryRoot,
        document: document,
        variables: variables,
    };
}
exports.buildRawOperationFromQuery = buildRawOperationFromQuery;
function buildRawOperationFromFragment(fragmentDocument, rootId, variables, fragmentName) {
    return {
        rootId: rootId,
        document: apollo_utilities_1.getFragmentQueryDocument(fragmentDocument, fragmentName),
        variables: variables,
        fragmentName: fragmentName,
        fromFragmentDocument: true,
    };
}
exports.buildRawOperationFromFragment = buildRawOperationFromFragment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBNEQ7QUFHNUQsb0NBQStEO0FBRy9EOztHQUVHO0FBQ0gsb0NBQTJDLFFBQXNCLEVBQUUsU0FBc0IsRUFBRSxNQUFlO0lBQ3hHLE1BQU0sQ0FBQztRQUNMLE1BQU0sRUFBRSxNQUFNLElBQUkscUJBQVksQ0FBQyxTQUFTO1FBQ3hDLFFBQVEsVUFBQTtRQUNSLFNBQVMsV0FBQTtLQUNWLENBQUM7QUFDSixDQUFDO0FBTkQsZ0VBTUM7QUFFRCx1Q0FDRSxnQkFBOEIsRUFDOUIsTUFBYyxFQUNkLFNBQXNCLEVBQ3RCLFlBQXFCO0lBRXJCLE1BQU0sQ0FBQztRQUNMLE1BQU0sUUFBQTtRQUNOLFFBQVEsRUFBRSwyQ0FBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUM7UUFDbEUsU0FBUyxXQUFBO1FBQ1QsWUFBWSxjQUFBO1FBQ1osb0JBQW9CLEVBQUUsSUFBSTtLQUMzQixDQUFDO0FBQ0osQ0FBQztBQWJELHNFQWFDIn0=