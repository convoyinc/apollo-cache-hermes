"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_tag_1 = require("graphql-tag");
var schema_1 = require("../../src/schema");
/**
 * Constructs a Query from a gql document.
 */
function query(gqlString, variables, rootId) {
    return {
        rootId: rootId || schema_1.StaticNodeId.QueryRoot,
        document: graphql_tag_1.default(gqlString),
        variables: variables,
    };
}
exports.query = query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGhxbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyYXBocWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEI7QUFHOUIsMkNBQXNFO0FBRXRFOztHQUVHO0FBQ0gsZUFBc0IsU0FBaUIsRUFBRSxTQUFzQixFQUFFLE1BQWU7SUFDOUUsTUFBTSxDQUFDO1FBQ0wsTUFBTSxFQUFFLE1BQU0sSUFBSSxxQkFBWSxDQUFDLFNBQVM7UUFDeEMsUUFBUSxFQUFFLHFCQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3hCLFNBQVMsV0FBQTtLQUNWLENBQUM7QUFDSixDQUFDO0FBTkQsc0JBTUMifQ==