"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OperationWalkNode = /** @class */ (function () {
    function OperationWalkNode(parsedOperation, parent) {
        this.parsedOperation = parsedOperation;
        this.parent = parent;
    }
    return OperationWalkNode;
}());
/**
 * Walk and run on ParsedQueryNode and the result.
 * This is used to verify result of the read operation.
 */
function walkOperation(rootOperation, result, visitor) {
    // Perform the walk as a depth-first traversal; and unlike the payload walk,
    // we don't bother tracking the path.
    var stack = [new OperationWalkNode(rootOperation, result)];
    while (stack.length) {
        var _a = stack.pop(), parsedOperation = _a.parsedOperation, parent_1 = _a.parent;
        // We consider null nodes to be skippable (and satisfy the walk).
        if (parent_1 === null)
            continue;
        // Fan-out for arrays.
        if (Array.isArray(parent_1)) {
            // Push in reverse purely for ergonomics: they'll be pulled off in order.
            for (var i = parent_1.length - 1; i >= 0; i--) {
                stack.push(new OperationWalkNode(parsedOperation, parent_1[i]));
            }
            continue;
        }
        var fields = [];
        for (var fieldName in parsedOperation) {
            var node = parsedOperation[fieldName];
            if (node.excluded) {
                continue;
            }
            fields.push(fieldName);
            var nextParsedQuery = node.children;
            if (nextParsedQuery) {
                stack.push(new OperationWalkNode(nextParsedQuery, get(parent_1, fieldName)));
            }
        }
        if (fields.length) {
            var shouldStop = visitor(parent_1, fields);
            if (shouldStop)
                return;
        }
    }
}
exports.walkOperation = walkOperation;
function get(value, key) {
    // Remember: arrays are typeof 'object', too.
    return value !== null && typeof value === 'object' ? value[key] : undefined;
}
exports.get = get;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTtJQUNFLDJCQUNrQixlQUF5QyxFQUN6QyxNQUFrQjtRQURsQixvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7UUFDekMsV0FBTSxHQUFOLE1BQU0sQ0FBWTtJQUNqQyxDQUFDO0lBQ04sd0JBQUM7QUFBRCxDQUFDLEFBTEQsSUFLQztBQU9EOzs7R0FHRztBQUNILHVCQUE4QixhQUF1QyxFQUFFLE1BQThCLEVBQUUsT0FBeUI7SUFFOUgsNEVBQTRFO0lBQzVFLHFDQUFxQztJQUNyQyxJQUFNLEtBQUssR0FBRyxDQUFDLElBQUksaUJBQWlCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFN0QsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxJQUFBLGdCQUEwQyxFQUF4QyxvQ0FBZSxFQUFFLG9CQUFNLENBQWtCO1FBQ2pELGlFQUFpRTtRQUNqRSxFQUFFLENBQUMsQ0FBQyxRQUFNLEtBQUssSUFBSSxDQUFDO1lBQUMsUUFBUSxDQUFDO1FBRTlCLHNCQUFzQjtRQUN0QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQix5RUFBeUU7WUFDekUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksaUJBQWlCLENBQUMsZUFBZSxFQUFFLFFBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUNELFFBQVEsQ0FBQztRQUNYLENBQUM7UUFFRCxJQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsR0FBRyxDQUFDLENBQUMsSUFBTSxTQUFTLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFNLElBQUksR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFeEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLFFBQVEsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZCLElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDdEMsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RSxDQUFDO1FBQ0gsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxRQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0MsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUFDLE1BQU0sQ0FBQztRQUN6QixDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUF4Q0Qsc0NBd0NDO0FBRUQsYUFBb0IsS0FBVSxFQUFFLEdBQWE7SUFDM0MsNkNBQTZDO0lBQzdDLE1BQU0sQ0FBQyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDOUUsQ0FBQztBQUhELGtCQUdDIn0=