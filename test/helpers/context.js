"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var util = require("util");
var CacheContext_1 = require("../../src/context/CacheContext");
exports.strictConfig = {
    freeze: true,
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: function (message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            throw new Error(util.format.apply(util, tslib_1.__spread(["warn:", message], args)));
        },
        group: jest.fn(),
        groupEnd: jest.fn(),
    },
};
exports.silentConfig = {
    freeze: true,
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        group: jest.fn(),
        groupEnd: jest.fn(),
    },
};
/** Cache context created using strictConfig */
function createStrictCacheContext() {
    return new CacheContext_1.CacheContext(exports.strictConfig);
}
exports.createStrictCacheContext = createStrictCacheContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkJBQTZCO0FBRTdCLCtEQUE4RDtBQUVqRCxRQUFBLFlBQVksR0FBK0I7SUFDdEQsTUFBTSxFQUFFLElBQUk7SUFDWixNQUFNLEVBQUU7UUFDTixLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNmLElBQUksWUFBQyxPQUFlO1lBQUUsY0FBYztpQkFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO2dCQUFkLDZCQUFjOztZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLE9BQVgsSUFBSSxvQkFBUSxPQUFPLEVBQUUsT0FBTyxHQUFLLElBQUksR0FBRSxDQUFDO1FBQzFELENBQUM7UUFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNoQixRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtLQUNwQjtDQUNGLENBQUM7QUFFVyxRQUFBLFlBQVksR0FBK0I7SUFDdEQsTUFBTSxFQUFFLElBQUk7SUFDWixNQUFNLEVBQUU7UUFDTixLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUNmLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7UUFDaEIsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7S0FDcEI7Q0FDRixDQUFDO0FBRUYsK0NBQStDO0FBQy9DO0lBQ0UsTUFBTSxDQUFDLElBQUksMkJBQVksQ0FBQyxvQkFBWSxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUZELDREQUVDIn0=