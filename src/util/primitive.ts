import { scalar } from '../primitive';

export function isScalar(value: any): value is scalar {
  return typeof value !== 'object' || value === null;
}

export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
