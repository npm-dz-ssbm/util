export * from "zod";
import * as Z from "zod";
import * as $ from "./core.js";
import * as Proxy from "./proxy.js";
type StringKeys<K extends keyof any> = K extends string ? K : never;
type SanitizedRecord<D extends Record<string, unknown>> = {
    [K in StringKeys<keyof D>]: D[K];
};
type ZV_T = string;
type ZV_DS = SanitizedRecord<Record<string, Z.ZodType>>;
type VariantFull<T extends ZV_T, DS extends ZV_DS> = {
    [V in keyof DS]: Z.ZodObject<{
        Data: DS[V];
        Type: Z.ZodLiteral<T>;
        Variant: Z.ZodLiteral<V extends string ? V : never>;
    }>;
};
type VariantVal<T extends ZV_T, DS extends ZV_DS> = VariantFull<T, DS>[keyof VariantFull<T, DS>];
type VariantVals<T extends ZV_T, DS extends ZV_DS> = [
    VariantVal<T, DS>,
    ...VariantVal<T, DS>[]
];
type ZodVariant<T extends ZV_T, DS extends ZV_DS> = Z.ZodDiscriminatedUnion<VariantVals<T, DS>, T>;
type VariantRawVal<T extends ZV_T, DS extends ZV_DS, V extends keyof DS> = {
    Data: Z.Infer<DS[V]>;
    Type: T;
    Variant: V;
    ZodTypeProxy: Proxy.Of<ZodVariant<T, DS>>;
};
type VariantCons<T extends ZV_T, DS extends ZV_DS> = {
    [V in keyof DS]: DS[V] extends Z.ZodUndefined ? VariantRawVal<T, DS, V> : (d: Z.infer<DS[V]>) => VariantRawVal<T, DS, V>;
};
export type VariantDef<T extends ZV_T, DS extends ZV_DS> = VariantCons<T, DS> & {
    zodType: ZodVariant<T, DS>;
};
export declare function defVariant<T extends ZV_T, DS extends ZV_DS>(t: T, d: DS): VariantDef<T, DS>;
type BaseDefined = {
    zodType: Z.ZodType;
};
type BaseDefinedVal = {
    ZodTypeProxy: Proxy.Of<any>;
};
export type inferDefined<T extends BaseDefined> = Z.infer<T["zodType"]> & {
    ZodTypeProxy: Proxy.Of<T["zodType"]>;
};
export type zodType<T extends BaseDefinedVal> = Proxy.Unwrap<T["ZodTypeProxy"]>;
export declare function parse<T extends Z.ZodType>(z: T, u: unknown): $.Result<Z.infer<T>, Z.ZodError>;
//# sourceMappingURL=types.d.ts.map