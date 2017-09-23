import { JsonObject, scalar } from '../primitive';

export function isScalar(value: any): value is scalar {
  return typeof value !== 'object' || value === null;
}

export function isObject(value: any): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value);
}
