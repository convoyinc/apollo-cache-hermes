import { JsonObject, nil, scalar } from '../primitive';

export function isScalar(value: any): value is scalar {
  return value === null || typeof value !== 'object';
}

export function isObject(value: any): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isObjectOrNull(value: any): value is JsonObject | null {
  return typeof value === 'object' && !Array.isArray(value);
}

export function isNil(value: any): value is nil {
  return value === null || value === undefined || Number.isNaN(value);
}

export function isNumber(element: any): element is Number {
  return !Number.isNaN(element) && typeof element === 'number';
}
