import * as T from "./types.js";
export type Nilable<T> = undefined | null | T;
export declare function isAny<T>(v: Nilable<T>): v is T;
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
export declare function of<M>(m?: M | undefined | null): Maybe<M>;
export declare function it<M>(m: Maybe<M>): Iterable<M>;
export declare function first<M>(...ms: Maybe<M>[]): Maybe<M>;
export declare function nil<M>(m: Maybe<M>): M | undefined;
export declare function or_<M>(m: Maybe<M>, getFb: () => M): M;
export declare function or<M>(m: Maybe<M>, fb: M): M;
export declare function map<Mi, Mo>(m: Maybe<Mi>, f: (i: Mi) => Mo): Maybe<Mo>;
//# sourceMappingURL=maybe.d.ts.map