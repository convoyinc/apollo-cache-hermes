"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Maintains a reference to the value of a specific parameterized field
 * contained within some other node.
 *
 * These values are stored outside of the entity that contains them, as the
 * entity node is reserved for static values.  At read time, these values are
 * overlaid on top of the static values of the entity that contains them.
 */
var ParameterizedValueSnapshot = /** @class */ (function () {
    function ParameterizedValueSnapshot(
        /** A reference to the entity this snapshot is about. */
        data, 
        /** Other node snapshots that point to this one. */
        inbound, 
        /** The node snapshots that this one points to. */
        outbound) {
        this.data = data;
        this.inbound = inbound;
        this.outbound = outbound;
    }
    return ParameterizedValueSnapshot;
}());
exports.ParameterizedValueSnapshot = ParameterizedValueSnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyYW1ldGVyaXplZFZhbHVlU25hcHNob3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJQYXJhbWV0ZXJpemVkVmFsdWVTbmFwc2hvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9BOzs7Ozs7O0dBT0c7QUFDSDtJQUNFO1FBQ0Usd0RBQXdEO1FBQ2pELElBQWdCO1FBQ3ZCLG1EQUFtRDtRQUM1QyxPQUF5QjtRQUNoQyxrREFBa0Q7UUFDM0MsUUFBMEI7UUFKMUIsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUVoQixZQUFPLEdBQVAsT0FBTyxDQUFrQjtRQUV6QixhQUFRLEdBQVIsUUFBUSxDQUFrQjtJQUNoQyxDQUFDO0lBQ04saUNBQUM7QUFBRCxDQUFDLEFBVEQsSUFTQztBQVRZLGdFQUEwQiJ9