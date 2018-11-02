import { InvalidEnvironmentError } from '.';

/**
 * Hermes relies on some ES6 functionality: iterators (via Symbol.iterator),
 * Sets, and Maps.
 *
 * Unfortunately, it can be tricky to polyfill correctly (and some environments
 * don't do it properly. Looking at you react-native on android). So, let's make
 * sure that everything is in a happy state, and complain otherwise.
 */
export function assertValidEnvironment() {
  const missingBehavior = [];
  if (!_isSymbolPolyfilled()) missingBehavior.push('Symbol');
  if (!_isSetPolyfilled()) missingBehavior.push('Set');
  if (!_isMapPolyfilled()) missingBehavior.push('Map');
  if (!missingBehavior.length) return;

  throw new InvalidEnvironmentError({
    message: `Hermes requires some ES2015 features that your current environment lacks: `
      + `${missingBehavior.join(', ')}. Please polyfill!`,
    infoUrl: `https://bit.ly/2SGa7uz`,
  });
}

function _isSymbolPolyfilled() {
  if (typeof Symbol !== 'function') return false;
  if (!Symbol.iterator) return false;

  return true;
}

function _isSetPolyfilled() {
  if (typeof Set !== 'function') return false;
  if (!_isSymbolPolyfilled()) return false;
  if (typeof (new Set)[Symbol.iterator] !== 'function') return false;

  return true;
}

function _isMapPolyfilled() {
  if (typeof Set !== 'function') return false;
  if (!_isSymbolPolyfilled()) return false;
  if (typeof (new Set)[Symbol.iterator] !== 'function') return false;

  return true;
}
