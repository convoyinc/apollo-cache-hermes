"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GraphSnapshot_1 = require("../GraphSnapshot");
var read_1 = require("./read");
var write_1 = require("./write");
/**
 * Return a new graph snapshot pruned to just the shape of the given query
 */
function prune(context, snapshot, raw) {
    var queryResult = read_1.read(context, raw, snapshot);
    var pruned = write_1.write(context, new GraphSnapshot_1.GraphSnapshot(), raw, queryResult.result && queryResult.complete ? queryResult.result : {});
    return {
        snapshot: pruned.snapshot,
        complete: queryResult.complete,
    };
}
exports.prune = prune;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJ1bmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcnVuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGtEQUFpRDtBQUlqRCwrQkFBOEI7QUFDOUIsaUNBQWdDO0FBRWhDOztHQUVHO0FBQ0gsZUFBc0IsT0FBcUIsRUFBRSxRQUF1QixFQUFFLEdBQWlCO0lBQ3JGLElBQU0sV0FBVyxHQUFHLFdBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2pELElBQU0sTUFBTSxHQUFHLGFBQUssQ0FDbEIsT0FBTyxFQUNQLElBQUksNkJBQWEsRUFBRSxFQUNuQixHQUFHLEVBQ0gsV0FBVyxDQUFDLE1BQU0sSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFnQixDQUNuRixDQUFDO0lBQ0YsTUFBTSxDQUFDO1FBQ0wsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1FBQ3pCLFFBQVEsRUFBRSxXQUFXLENBQUMsUUFBUTtLQUMvQixDQUFDO0FBQ0osQ0FBQztBQVpELHNCQVlDIn0=