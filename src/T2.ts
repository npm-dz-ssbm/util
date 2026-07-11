import * as Z from "zod";
import * as $ from "./core.js";
import * as Proxy from "./proxy.js";
import type { Apply, Arg0, TypeLambda1, Call1, Kind, HKT } from "hkt-core";

export function parse<T extends Z.ZodType>(
  z: T,
  u: unknown,
): $.Result<Z.infer<T>, Z.ZodError> {
  const parsed = z.safeParse(u);
  return parsed.success ? $.Ok(parsed.data) : $.Err(parsed.error);
}

type BaseSpec<Plus extends Z.ZodType = Z.ZodType> = Record<
  string,
  Z.ZodType | undefined | Plus
>;

type RawLiftedSpec<Spec extends BaseSpec> = {
  [V in keyof Spec]: V extends string
    ? Z.ZodObject<{
        Variant: Z.ZodLiteral<V>;
        Data: Spec[V] extends Z.ZodType ? Spec[V] : Z.ZodUndefined;
      }>
    : never;
};

type LiftedSpec<Spec extends BaseSpec> =
  RawLiftedSpec<Spec>[keyof RawLiftedSpec<Spec>];

type FullLiftedSpec<Spec extends BaseSpec> = [
  Z.ZodObject<{ Variant: Z.ZodNever; Data: Z.ZodNever }>,
  LiftedSpec<Spec>,
];

type VariantDataFns<Spec extends BaseSpec, R> = {
  [V in keyof Spec]: V extends string
    ? (d: Spec[V] extends undefined ? undefined : Z.infer<Spec[V]>) => R
    : never;
};

type MatchSpec<Spec extends BaseSpec, R> =
  | VariantDataFns<Spec, R>
  | (Partial<VariantDataFns<Spec, R>> & Record<typeof $._, () => R>);

type _V<T, V, D> = { Type: T; Variant: V; Data: D };
type VariantVal<
  Type extends string,
  Spec extends BaseSpec,
  V,
> = V extends keyof BaseSpec
  ? _V<Type, V, Spec[V] extends undefined ? undefined : Z.infer<Spec[V]>>
  : never;
type VariantValCons<
  Type extends string,
  Spec extends BaseSpec,
  V,
> = V extends keyof BaseSpec
  ? Spec[V] extends undefined
    ? VariantVal<Type, Spec, V>
    : (d: Z.infer<Spec[V]>) => VariantVal<Type, Spec, V>
  : never;
type VariantAnyVal<Type extends string, Spec extends BaseSpec> = VariantVal<
  Type,
  Spec,
  keyof Spec
>;

type MatchFn<Type extends string, Spec extends BaseSpec> = <R>(
  ms: MatchSpec<Spec, R>,
  v: VariantAnyVal<Type, Spec>,
) => R;

type VariantCons<Type extends string, Spec extends BaseSpec> = {
  [V in keyof Spec]: VariantValCons<Type, Spec, V>;
};
type VariantZodType<
  Type extends string,
  Spec extends BaseSpec,
> = Z.ZodIntersection<
  Z.ZodObject<{ Type: Z.ZodLiteral<Type> }>,
  Z.ZodDiscriminatedUnion<FullLiftedSpec<Spec>, "Variant">
>;

type VariantEnhanced<T extends string, S extends BaseSpec, Base> = Base &
  VariantCons<T, S> & { VariantType: T; match: MatchFn<T, S> };

export type ZodVariant<T extends string, S extends BaseSpec> = VariantEnhanced<
  T,
  S,
  VariantZodType<T, S>
>;
export type GenericZodVariant<
  Args extends any[],
  T extends string,
  S extends BaseSpec,
> = VariantEnhanced<T, S, (...args: Args) => VariantZodType<T, S>>;

type BaseSpecGeneric<Args extends any[]> = Record<
  string,
  ((...args: Args) => Z.ZodType | undefined) | undefined
>;

type UnG<SpecG extends BaseSpecGeneric<any>> = {
  [K in keyof SpecG]: SpecG[K] extends (...args: any[]) => any
    ? ReturnType<SpecG[K]>
    : undefined;
};
type UnUnG<Spec extends BaseSpec> = {
  [K in keyof Spec]: Spec[K] extends undefined ? undefined : () => Spec[K];
};

function variantEnhance<T extends string, S extends BaseSpec, B extends object>(
  t: T,
  s: { [K in keyof S]: any },
  b: B,
): VariantEnhanced<T, S, B> {
  const Cons: VariantCons<T, S> = $.mapValues(s, (z, Variant) =>
    !z
      ? { Type: t, Variant, Data: undefined }
      : (Data: Z.infer<S[typeof Variant]>) => ({
          Data,
          Variant,
          Type: t,
        }),
  ) as VariantCons<T, S>;
  const match: MatchFn<T, S> = (ms, v) =>
    ((ms[v.Variant] || ms[$._ as any]) as any)(v.Data);
  return Object.assign(b, { VariantType: t }, Cons, { match });
}

abstract class VariantSpecC {}

function genericVariantImpl<
  Type extends string,
  Args extends Z.ZodType[],
  SpecFn extends (...args: Args) => BaseSpec,
>(
  t: Type,
  mkSpec: SpecFn,
): (...args: Args) => ZodVariant<Type, ReturnType<SpecFn>> {
  return (...args: Args) => {
    const spec = mkSpec(...args) as ReturnType<SpecFn>;
    return variantEnhance<
      Type,
      ReturnType<SpecFn>,
      VariantZodType<Type, ReturnType<SpecFn>>
    >(
      t,
      spec,
      Z.intersection(
        Z.object({ Type: Z.literal(t) }),
        Z.discriminatedUnion(
          "Variant",
          Object.entries(spec).map(([v, d]) =>
            Z.object({
              Variant: Z.literal(v),
              Data: d || Z.undefined(),
            }),
          ) as FullLiftedSpec<ReturnType<SpecFn>>,
        ),
      ),
    );
  };
}

export function variant<Type extends string, Spec extends BaseSpec>(
  t: Type,
  spec: Spec,
): ZodVariant<Type, Spec> {
  return variantEnhance<Type, Spec, VariantZodType<Type, Spec>>(
    t,
    spec,
    genericVariantImpl<Type, [], () => Spec>(t, () => spec)(),
  );
}

type MaybeGeneric<A extends Z.ZodType> = {
  Some: A;
  None: undefined;
};
interface MaybeHKT extends TypeLambda1 {
  return: MaybeGeneric<Arg0<this>>;
}

function MkGeneric<F extends HKT>(
  tc: <T extends Z.ZodType>(a: T) => Kind<F, T>,
): <T extends Z.ZodType>(t: T) => Kind<F, T> {
  return tc;
}

const Maybe = MkGeneric<MaybeHKT>(<T>(t: T) => ({ Some: t, None: undefined }));
const MaybeString = Maybe(Z.string());

/*

type GenVar1<T extends Z.ZodType> = (t: T) => BaseSpec;

export class TypeParam1 {}
export class TypeParam2 {}
export class TypeParam3 {}

export function genericVariant1<Type extends string, F extends HKT>(
  t: Type,
  mkSpec: any,
): <A1 extends Z.ZodType>(a1: A1) => ZodVariant<Type, ReturnType<Kind<F, A1>>> {
  const anySpec: ReturnType<SpecFn> = mkSpec(Z.any()) as ReturnType<SpecFn>;
  return variantEnhance<
    Type,
    ReturnType<SpecFn>,
    <A1 extends Z.ZodType>(a1: A1) => ZodVariant<Type, ReturnType<SpecFn>>
  >(t, anySpec, genericVariantImpl(t, mkSpec) as any) as any;
}


function Maybe_<T extends Z.ZodType>(t: T): { Just: T; None: undefined } {
  return {
    Just: t,
    None: undefined,
  };
}
function Maybe__<T extends Z.ZodType>(): Proxy.Of<{
  Just: T;
  None: undefined;
}> {
  return Proxy.Of();
}

function bimap<F extends <T extends Z.ZodType>() => Proxy.Of<BaseSpec<T>>>(
  f: F,
  g: <T extends Z.ZodType>(t: T) => Proxy.Unwrap<ReturnType<F<T>>,
) {
  return <T extends Z.ZodType>(t: T) => variant("Maybe", g<T>(t));
}

const Maybe = bimap(Maybe__, Maybe_);
const MaybeString = Maybe(Z.string());

export function variant<Type extends string, Spec extends BaseSpec>(
  t: Type,
  spec: Spec,
): ZodVariant<Type, Spec> {
  return variantEnhance<Type, Spec, VariantZodType<Type, Spec>>(
    t,
    spec,
    genericVariantImpl<Type, [], UnUnG<Spec>>(
      t,
      $.mapValues(spec, (res) => () => res) as any,
    )() as any,
  );
}

const MaybeInt = variant("MaybeInt", { Some: Z.number(), None: undefined });
type MaybeInt = Z.infer<typeof MaybeInt>;
console.log({ MaybeInt, miS: MaybeInt.Some(123), miN: MaybeInt.None });

const Maybe = genericVariant<<T extends Z.ZodType>() => [T]>()("Maybe", {
  Some: (v) => v,
  None: undefined,
});

const MaybeString = Maybe(Z.string());
console.log({ MaybeString, miS: MaybeString.Some(123), miN: MaybeString.None });
// const m$ = new G$args<<T extends Z.ZodType>() => [T]>();
const m$ = new G$Base<
  <T extends Z.ZodType>(t: T) => { Some: (t: T) => T; None: undefined }
>();
const MaybeBase = m$.variant("Maybe", {
  Some: (v) => v,
  None: undefined,
});
const MaybeString = MaybeBase<[Z.ZodString]>(Z.string());
MaybeString.Some("asdf");


*/
