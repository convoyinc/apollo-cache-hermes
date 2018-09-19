"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var write_1 = require("./write");
/**
 * Helper for creating graphSnapshot used by
 * extract or restore function.
 */
function createGraphSnapshot(payload, gqlString, cacheContext, gqlVariables, rootId) {
    return write_1.createSnapshot(payload, gqlString, gqlVariables, rootId, cacheContext).snapshot;
}
exports.createGraphSnapshot = createGraphSnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcmlhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFLQSxpQ0FBeUM7QUFFekM7OztHQUdHO0FBQ0gsNkJBQ0UsT0FBbUIsRUFDbkIsU0FBaUIsRUFDakIsWUFBMEIsRUFDMUIsWUFBeUIsRUFDekIsTUFBZTtJQUVmLE1BQU0sQ0FBQyxzQkFBYyxDQUNuQixPQUFPLEVBQ1AsU0FBUyxFQUNULFlBQVksRUFDWixNQUFNLEVBQ04sWUFBWSxDQUNiLENBQUMsUUFBUSxDQUFDO0FBQ2IsQ0FBQztBQWRELGtEQWNDIn0=