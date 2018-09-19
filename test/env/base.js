"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var chai_jest_diff_1 = require("chai-jest-diff");
// Chai
// We prefer Chai's `expect` interface.
global.expect = chai.expect;
// Give us all the info!
chai.config.truncateThreshold = 0;
// Pretty expectation output for Chai assertions
chai.use(chai_jest_diff_1.default());
// Promise-aware chai assertions (that return promises themselves):
//
//   await expect(promise).to.be.rejectedWith(/error/i);
//
chai.use(chaiAsPromised);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFBNkI7QUFDN0IsaURBQW1EO0FBQ25ELGlEQUEwQztBQUUxQyxPQUFPO0FBRVAsdUNBQXVDO0FBQ3ZDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUM1Qix3QkFBd0I7QUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFFbEMsZ0RBQWdEO0FBQ2hELElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQVksRUFBRSxDQUFDLENBQUM7QUFFekIsbUVBQW1FO0FBQ25FLEVBQUU7QUFDRix3REFBd0Q7QUFDeEQsRUFBRTtBQUNGLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUMifQ==