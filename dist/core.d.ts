import * as T from "./types.js";
export declare function Maybe<M extends T.z.ZodType>(m: M): T.VariantDef<"Maybe", {
    Some: M;
    None: T.ZodNull;
}>;
export type Maybe<M> = {
    type: "Maybe";
    Variant: "Some";
    Data: M;
} | {
    type: "Maybe";
    Variant: "None";
    Data: null;
};
export type Maybe_X<T extends Maybe<any>> = NonNullable<T & {
    Variant: "Some";
} extends Maybe<infer M> ? M : never>;
export declare function Some<M>(m: M): Maybe<M>;
export declare function None<M>(): Maybe<M>;
export declare function Result<O extends T.ZodType, E extends T.ZodType>(o: O, e: E): T.VariantDef<"Result", {
    Ok: O;
    Err: E;
}>;
export type Result<O, E> = {
    type: "Result";
    Variant: "Ok";
    Data: O;
} | {
    type: "Result";
    Variant: "Err";
    Data: E;
};
export declare function Ok<L>(l: L): Result<L, never>;
export declare function Err<R>(r: R): Result<never, R>;
type SomeFn = {
    <Mt, Et>(m: Maybe<Mt>, e: Et): Result<Mt, Et>;
    <Mt>(m: Maybe<Mt>): Result<Mt, undefined>;
};
export declare const some: SomeFn;
export declare function invertResult<O, E>(r: Result<O, E>): Result<E, O>;
export declare function maybeFromNullable<M>(m?: M | undefined | null): Maybe<M>;
export declare function arrayFromMaybe<M>(m: Maybe<M>): M[];
export declare function firstMaybe<M>(...ms: Maybe<M>[]): Maybe<M>;
export declare function nullableFromMaybe<M>(m: Maybe<M>): M | null;
export declare function orMaybe<M>(m: Maybe<M>, fb: M): M;
export declare function orMaybe_<M>(m: Maybe<M>, getFb: () => M): M;
export declare function mapMaybe<Mi, Mo>(m: Maybe<Mi>, f: (i: Mi) => Mo): Maybe<Mo>;
export declare function quot(n: number, d: number): number;
export declare function withInd<T>(a: T[]): [T, number][];
export declare function chunk<T>(a: T[], n: number): T[][];
export declare function timeout(ms: number): Promise<void>;
export type Nilable<T> = undefined | null | T;
export declare function isAny<T>(v: Nilable<T>): v is T;
export declare function isNil<T>(v: Nilable<T>): v is undefined | null;
export declare function nilable<T>(t: Nilable<T>): T | undefined;
export declare function snilable(t: Nilable<string>): string | undefined;
export declare function nullable<T>(t: Nilable<T>): T | null;
export declare function snullable(t: Nilable<string>): string | null;
export declare function simpleHash(str: string): number;
export type WithAllPropertiesAs<R, T> = {
    [KK in keyof R]: T;
};
export declare function mapValues<T extends object, R>(obj: T, fn: (value: T[keyof T], key: keyof T, object: T) => R): {
    [K in keyof T]: R;
};
export {};
//# sourceMappingURL=core.d.ts.map