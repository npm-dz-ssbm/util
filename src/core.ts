import * as T from "./types.js";

export function Maybe<M extends T.z.ZodType>(
  m: M,
): T.VariantDef<"Maybe", { Some: M; None: T.ZodNull }> {
  return T.defVariant("Maybe", {
    Some: m,
    None: T.null(),
  });
}
export type Maybe<M> =
  | { type: "Maybe"; Variant: "Some"; Data: M }
  | { type: "Maybe"; Variant: "None"; Data: null };
export type Maybe_X<T extends Maybe<any>> = NonNullable<
  T & { Variant: "Some" } extends Maybe<infer M> ? M : never
>;

export function Some<M>(m: M): Maybe<M> {
  return { type: "Maybe", Variant: "Some", Data: m };
}
export function None<M>(): Maybe<M> {
  return { type: "Maybe", Variant: "None", Data: null };
}

export function isSome<M>(
  m: Maybe<M>,
): m is { type: "Maybe"; Variant: "Some"; Data: M } {
  return m.Variant === "Some";
}

export function isNone(
  m: Maybe<any>,
): m is { type: "Maybe"; Variant: "None"; Data: null } {
  return m.Variant === "None";
}

export function Result<O extends T.ZodType, E extends T.ZodType>(
  o: O,
  e: E,
): T.VariantDef<"Result", { Ok: O; Err: E }> {
  return T.defVariant("Result", {
    Ok: o,
    Err: e,
  });
}
export type Result<O, E> =
  | { type: "Result"; Variant: "Ok"; Data: O }
  | { type: "Result"; Variant: "Err"; Data: E };
export function Ok<L>(l: L): Result<L, never> {
  return { type: "Result", Variant: "Ok", Data: l };
}
export function Err<R>(r: R): Result<never, R> {
  return { type: "Result", Variant: "Err", Data: r };
}

export function isOk<O, E>(
  r: Result<O, E>,
): r is { type: "Result"; Variant: "Ok"; Data: O } {
  return r.Variant === "Ok";
}

export function isErr<O, E>(
  r: Result<O, E>,
): r is { type: "Result"; Variant: "Err"; Data: E } {
  return r.Variant === "Err";
}

export function maybe$<M>(m: Maybe<M>): <T>(s: (s: M) => T, n: () => T) => T {
  return (onSome, onNone) => (isSome(m) ? onSome(m.Data) : onNone());
}

export function result$<O, E>(
  r: Result<O, E>,
): <T>(o: (o: O) => T, e: (e: E) => T) => T {
  return (onOk, onErr) => (isOk(r) ? onOk(r.Data) : onErr(r.Data));
}

type SomeFn = {
  <Mt, Et>(m: Maybe<Mt>, e: Et): Result<Mt, Et>;
  <Mt>(m: Maybe<Mt>): Result<Mt, undefined>;
};

export const some: SomeFn = (...args: Parameters<SomeFn>) => {
  const [arg1, arg2 = undefined] = args;
  if (arg1.Variant === "Some") {
    return Ok(arg1.Data);
  }
  return Err(arg2);
};

export function invertResult<O, E>(r: Result<O, E>): Result<E, O> {
  return r.Variant === "Err" ? Ok(r.Data) : Err(r.Data);
}

export function maybeFromNullable<M>(m?: M | undefined | null): Maybe<M> {
  return isAny(m) ? Some(m) : None();
}

export function arrayFromMaybe<M>(m: Maybe<M>): M[] {
  return m.Variant === "None" ? [] : [m.Data];
}

export function firstMaybe<M>(...ms: Maybe<M>[]): Maybe<M> {
  for (const m of ms) {
    for (const el of arrayFromMaybe(m)) {
      return Some(el);
    }
  }
  return None();
}

export function nullableFromMaybe<M>(m: Maybe<M>): M | null {
  return m.Variant === "None" ? null : m.Data;
}

export function orMaybe<M>(m: Maybe<M>, fb: M): M {
  return m.Variant === "None" ? fb : m.Data;
}

export function orMaybe_<M>(m: Maybe<M>, getFb: () => M): M {
  return m.Variant === "None" ? getFb() : m.Data;
}

export function mapMaybe<Mi, Mo>(m: Maybe<Mi>, f: (i: Mi) => Mo): Maybe<Mo> {
  return m.Variant === "None" ? None() : Some(f(m.Data));
}

export function quot(n: number, d: number): number {
  return Math.floor(n / d);
}

export function withInd<T>(a: T[]): [T, number][] {
  return a.map((e, i) => [e, i]);
}

export function chunk<T>(a: T[], n: number): T[][] {
  const res: T[][] = [];
  let nextChunk: T[] = [];
  for (const [e, i] of withInd(a)) {
    nextChunk.push(e);
    if (quot(i, n) !== quot(i + 1, n)) {
      res.push(nextChunk);
      nextChunk = [];
    }
  }
  if (nextChunk.length > 0) {
    res.push(nextChunk);
  }
  return res;
}

export function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type Nilable<T> = undefined | null | T;

export function isAny<T>(v: Nilable<T>): v is T {
  return v !== undefined && v !== null;
}

export function isNil<T>(v: Nilable<T>): v is undefined | null {
  return v === undefined || v === null;
}

export function nilable<T>(t: Nilable<T>): T | undefined {
  return isAny(t) ? t : undefined;
}
export function snilable(t: Nilable<string>): string | undefined {
  return t === "" ? undefined : nilable(t);
}
export function nullable<T>(t: Nilable<T>): T | null {
  return isAny(t) ? t : null;
}
export function snullable(t: Nilable<string>): string | null {
  return t === "" ? null : nullable(t);
}
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

export type WithAllPropertiesAs<R, T> = { [KK in keyof R]: T };

export function mapValues<T extends object, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T, object: T) => R,
): { [K in keyof T]: R } {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const k = key as keyof T;
      acc[k] = fn(obj[k], k, obj);
      return acc;
    },
    {} as { [K in keyof T]: R },
  );
}

export type Param0<F extends (...a: any[]) => any> = Parameters<F>[0];
export type Param1<F extends (...a: any[]) => any> = Parameters<F>[1];
export type Param2<F extends (...a: any[]) => any> = Parameters<F>[2];

export type Merge<A, B> = Omit<A, keyof B> & B;

export function greedy<R>(f: () => R): R {
  return f();
}
