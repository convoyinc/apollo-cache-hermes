import { JsonObject, nil, scalar } from '../primitive';
export declare function isScalar(value: any): value is scalar;
export declare function isObject(value: any): value is JsonObject;
export declare function isObjectOrNull(value: any): value is JsonObject | null;
export declare function isNil(value: any): value is nil;
export declare function isNumber(element: any): element is Number;
