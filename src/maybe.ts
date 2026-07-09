import * as T from "./T.js";

export type Nilable<T> = undefined | null | T;

export function isAny<T>(v: Nilable<T>): v is T {
  return v !== undefined && v !== null;
}

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

export function of<M>(m?: M | undefined | null): Maybe<M> {
  return isAny(m) ? Some(m) : None();
}

export function it<M>(m: Maybe<M>): Iterable<M> {
  return m.Variant === "None" ? [] : [m.Data];
}

export function first<M>(...ms: Maybe<M>[]): Maybe<M> {
  for (const m of ms) {
    for (const el of it(m)) {
      return Some(el);
    }
  }
  return None();
}

export function nil<M>(m: Maybe<M>): M | undefined {
  return m.Variant === "None" ? undefined : m.Data;
}

export function or_<M>(m: Maybe<M>, getFb: () => M): M {
  return m.Variant === "None" ? getFb() : m.Data;
}

export function or<M>(m: Maybe<M>, fb: M): M {
  return or_(m, () => fb);
}

export function map<Mi, Mo>(m: Maybe<Mi>, f: (i: Mi) => Mo): Maybe<Mo> {
  return m.Variant === "None" ? None() : Some(f(m.Data));
}
