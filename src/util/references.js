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
    if (fromIndex < 0)
        return false;
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
 * Return true if { id, path } is a valid reference in the node's references
 * array. Otherwise, return false.
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
/**
 * Return true if of 'path' points to a valid reference field
 */
function isReferenceField(snapshot, path) {
    var references = snapshot['outbound'];
    if (!references)
        return false;
    var index = references.findIndex(function (reference) {
        return apollo_utilities_1.isEqual(reference.path, path);
    });
    return (index >= 0);
}
exports.isReferenceField = isReferenceField;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlZmVyZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBMkM7QUFRM0M7Ozs7R0FJRztBQUNILDZCQUNFLFNBQTZCLEVBQzdCLFFBQXNCLEVBQ3RCLEVBQVUsRUFDVixJQUFnQjtJQUVoQixJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBRTdCLElBQU0sU0FBUyxHQUFHLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakUsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDaEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFaEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN2QixRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQzVCLENBQUM7QUFsQkQsa0RBa0JDO0FBRUQ7O0dBRUc7QUFDSCwwQkFDRSxTQUE2QixFQUM3QixRQUFzQixFQUN0QixFQUFVLEVBQ1YsSUFBZ0I7SUFFaEIsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNoQixVQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsSUFBTSxHQUFHLEdBQUcsd0JBQXdCLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRCxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLENBQUMsQ0FBQztRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFDO0FBakJELDRDQWlCQztBQUVEOzs7R0FHRztBQUNILDBCQUNFLFFBQXNCLEVBQ3RCLElBQXdCLEVBQ3hCLEVBQVUsRUFDVixJQUFnQjtJQUVoQixJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLElBQUksd0JBQXdCLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDdkYsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNkLENBQUM7QUFURCw0Q0FTQztBQUVEOzs7R0FHRztBQUNILGtDQUFrQyxVQUEyQixFQUFFLEVBQVUsRUFBRSxJQUFnQjtJQUN6RixNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFDLFNBQVM7UUFDcEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLDBCQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5RCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7R0FFRztBQUNILDBCQUNFLFFBQXNCLEVBQ3RCLElBQWdCO0lBRWhCLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN4QyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDOUIsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFDLFNBQVM7UUFDM0MsTUFBTSxDQUFDLDBCQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztJQUNILE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDO0FBVkQsNENBVUMifQ==