/**
 * Hermes relies on some ES6 functionality: iterators (via Symbol.iterator),
 * Sets, and Maps.
 *
 * Unfortunately, it can be tricky to polyfill correctly (and some environments
 * don't do it properly. Looking at you react-native on android). So, let's make
 * sure that everything is in a happy state, and complain otherwise.
 */
export function assertValidEnvironment() {

}

function _isSymbolPolyfilled() {
  if (typeof Symbol !== 'function') return false;
  if (!Symbol.iterator) return false;

  return true;
}

function _isSetPolyfilled() {
  if (typeof Set !== 'function') return false;
  if (typeof (new Set)[Symbol.iterator] !== 'function') return false;

  return true;
}

function _isMapPolyfilled() {
  if (typeof Set !== 'function') return false;
  if (typeof (new Set)[Symbol.iterator] !== 'function') return false;

  return true;
}
