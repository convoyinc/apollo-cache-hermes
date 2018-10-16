import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import chaiJestDiff from 'chai-jest-diff';

// Chai

// We are transitioning to using Jasmine for our test expects.  During the
// transition, Jasmine and chai will be run in parallel using jestExpect for
// Jasmine, and the default expect for chai.  Once complete, Jasmine will
// replace the chai global.expect.
global.jestExpect = global.expect;
// We prefer Chai's `expect` interface.
global.expect = chai.expect;

// Give us all the info!
chai.config.truncateThreshold = 0;

// Pretty expectation output for Chai assertions
chai.use(chaiJestDiff());

// Promise-aware chai assertions (that return promises themselves):
//
//   await expect(promise).to.be.rejectedWith(/error/i);
//
chai.use(chaiAsPromised);
