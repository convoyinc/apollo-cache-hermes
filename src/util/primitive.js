"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isScalar(value) {
    return value === null || typeof value !== 'object';
}
exports.isScalar = isScalar;
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
exports.isObject = isObject;
function isObjectOrNull(value) {
    return typeof value === 'object' && !Array.isArray(value);
}
exports.isObjectOrNull = isObjectOrNull;
function isNil(value) {
    return value === null || value === undefined || Number.isNaN(value);
}
exports.isNil = isNil;
function isNumber(element) {
    return typeof element === 'number' && !Number.isNaN(element);
}
exports.isNumber = isNumber;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbWl0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpbWl0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsa0JBQXlCLEtBQVU7SUFDakMsTUFBTSxDQUFDLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDO0FBQ3JELENBQUM7QUFGRCw0QkFFQztBQUVELGtCQUF5QixLQUFVO0lBQ2pDLE1BQU0sQ0FBQyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUUsQ0FBQztBQUZELDRCQUVDO0FBRUQsd0JBQStCLEtBQVU7SUFDdkMsTUFBTSxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUZELHdDQUVDO0FBRUQsZUFBc0IsS0FBVTtJQUM5QixNQUFNLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUZELHNCQUVDO0FBRUQsa0JBQXlCLE9BQVk7SUFDbkMsTUFBTSxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUZELDRCQUVDIn0=