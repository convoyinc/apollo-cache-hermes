import { JsonObject, Nil, Scalar } from '../primitive';

export function isScalar(value: any): value is Scalar {
  return value === null || typeof value !== 'object';
}

export function isObject(value: any): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isObjectOrNull(value: any): value is JsonObject | null {
  return typeof value === 'object' && !Array.isArray(value);
}

export function isNil(value: any): value is Nil {
  return value === null || value === undefined || Number.isNaN(value);
}

export function isNumber(element: any): element is Number {
  return typeof element === 'number' && !Number.isNaN(element);
}

export function verboseTypeof(value: any): string {
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

export const { hasOwnProperty: hasOwn } = Object.prototype;

export function ifString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
