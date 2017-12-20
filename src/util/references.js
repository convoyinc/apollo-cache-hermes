"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_utilities_1 = require("apollo-utilities");
/**
 * Mutates a snapshot, removing an inbound reference from it.
 *
 * Returns whether all references were removed.
 */
function removeNodeReference(direction, snapshot, id, path) {
    var references = snapshot[direction];
    if (!references)
        return true;
    var fromIndex = getIndexOfGivenReference(references, id, path);
    references.splice(fromIndex, 1);
    if (!references.length) {
        snapshot[direction] = undefined;
    }
    return !references.length;
}
exports.removeNodeReference = removeNodeReference;
/**
 * Mutates a snapshot, adding a new reference to it.
 */
function addNodeReference(direction, snapshot, id, path) {
    var references = snapshot[direction];
    if (!references) {
        references = snapshot[direction] = [];
    }
    var idx = getIndexOfGivenReference(references, id, path);
    if (idx === -1) {
        references.push({ id: id, path: path });
        return true;
    }
    return false;
}
exports.addNodeReference = addNodeReference;
/**
 * Return index of { id, path } reference in references array.
 * Otherwise, return -1.
 */
function hasNodeReference(snapshot, type, id, path) {
    var references = snapshot[type];
    if (!references || getIndexOfGivenReference(references, id, path) === -1)
        return false;
    return true;
}
exports.hasNodeReference = hasNodeReference;
/**
 * Return index of { id, path } reference in references array.
 * Otherwise, return -1.
 */
function getIndexOfGivenReference(references, id, path) {
    return references.findIndex(function (reference) {
        return reference.id === id && apollo_utilities_1.isEqual(reference.path, path);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlZmVyZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBMkM7QUFRM0M7Ozs7R0FJRztBQUNILDZCQUNFLFNBQTZCLEVBQzdCLFFBQXNCLEVBQ3RCLEVBQVUsRUFDVixJQUFnQjtJQUVoQixJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBRTdCLElBQU0sU0FBUyxHQUFHLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFaEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN2QixRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQzVCLENBQUM7QUFqQkQsa0RBaUJDO0FBRUQ7O0dBRUc7QUFDSCwwQkFDRSxTQUE2QixFQUM3QixRQUFzQixFQUN0QixFQUFVLEVBQ1YsSUFBZ0I7SUFFaEIsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNoQixVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsSUFBTSxHQUFHLEdBQUcsd0JBQXdCLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRCxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLENBQUMsQ0FBQztRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFDO0FBakJELDRDQWlCQztBQUVEOzs7R0FHRztBQUNILDBCQUNFLFFBQXNCLEVBQ3RCLElBQXdCLEVBQ3hCLEVBQVUsRUFDVixJQUFnQjtJQUVoQixJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksd0JBQXdCLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDdkYsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNkLENBQUM7QUFURCw0Q0FTQztBQUVEOzs7R0FHRztBQUNILGtDQUFrQyxVQUEyQixFQUFFLEVBQVUsRUFBRSxJQUFnQjtJQUN6RixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFDLFNBQVM7UUFDcEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLDBCQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMifQ==