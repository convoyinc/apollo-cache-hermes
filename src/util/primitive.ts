import { scalar } from '../primitive';

export function isScalar(value: any): value is scalar {
  return typeof value !== 'object';
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && !Array.isArray(value);
}
