"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Maintains a reference to a single entity within the cached graph, and any
 * bookkeeping metadata associated with it.
 *
 * Note that this houses all the _static_ values for an entity, but none of the
 * parameterized values that may also have been queried for it.
 */
var EntitySnapshot = /** @class */ (function () {
    function EntitySnapshot(
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
    return EntitySnapshot;
}());
exports.EntitySnapshot = EntitySnapshot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW50aXR5U25hcHNob3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJFbnRpdHlTbmFwc2hvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9BOzs7Ozs7R0FNRztBQUNIO0lBQ0U7SUFDRSx3REFBd0Q7SUFDakQsSUFBaUI7SUFDeEIsbURBQW1EO0lBQzVDLE9BQXlCO0lBQ2hDLGtEQUFrRDtJQUMzQyxRQUEwQjtRQUoxQixTQUFJLEdBQUosSUFBSSxDQUFhO1FBRWpCLFlBQU8sR0FBUCxPQUFPLENBQWtCO1FBRXpCLGFBQVEsR0FBUixRQUFRLENBQWtCO0lBQ2hDLENBQUM7SUFDTixxQkFBQztBQUFELENBQUMsQUFURCxJQVNDO0FBVFksd0NBQWMifQ==