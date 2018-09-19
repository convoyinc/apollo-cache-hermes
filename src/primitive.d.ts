/**
 * @fileoverview
 *
 * We rely on a few generic types that aren't included by default in TypeScript.
 */
/**
 * A primitive value.
 */
export declare type scalar = undefined | null | boolean | number | string | Symbol;
/**
 * A missing object.
 */
export declare type nil = undefined | null;
/**
 * A component of a path through objects/arrays.
 */
export declare type PathPart = number | string;
/**
 * A JavaScript constructor.
 */
export interface Constructor<TClass extends object> {
    new (...args: any[]): TClass;
    prototype: TClass;
}
/**
 * A partial object, applied recursively.
 */
export declare type DeepPartial<TType> = {
    [Key in keyof TType]?: DeepPartial<TType[Key]>;
};
/**
 * A readonly object, applied recursively.
 */
export declare type DeepReadonly<TType> = {
    readonly [Key in keyof TType]: DeepReadonly<TType[Key]>;
};
/**
 * Represents a complex object that can contain values of a specific type,
 * that can be rooted within objects/arrays of arbitrary depth.
 */
export declare type NestedValue<TValue> = TValue | NestedArray<TValue> | NestedObject<TValue>;
export interface NestedArray<TValue> extends Array<NestedValue<TValue>> {
}
export interface NestedObject<TValue> {
    [key: string]: NestedValue<TValue>;
}
export declare type JsonScalar = null | boolean | number | string;
export declare type JsonValue = NestedValue<JsonScalar>;
export declare type JsonObject = NestedObject<JsonScalar>;
export declare type JsonArray = NestedArray<JsonScalar>;
