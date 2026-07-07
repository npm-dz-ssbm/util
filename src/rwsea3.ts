import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";

class AsyncTag {}

type CatcherType<Err, Res> = (e: any) => undefined | $.Result<Res, Err>;

type BaseXYields<E, A> =
  | { Type: "BaseXYields"; Variant: "Pass"; Data: null }
  | { Type: "BaseXYields"; Variant: "Err"; Data: E }
  | (A extends AsyncTag
      ? {
          Type: "BaseXYields";
          Variant: "Await";
          Data: [Promise<unknown>, CatcherType<E, unknown>];
        }
      : never);

type GottenDefault<I, K extends string, D> = I extends Record<K, D> ? I[K] : D;
type DefaultHaver<I, K extends string, D> =
  | undefined
  | (I extends Record<K, D> ? I : Record<K, undefined>);

type GottenReads<I> = GottenDefault<I, "reads", {}>;

function safeGetter<K extends string, D>(
  k: K,
  d: D,
): <I>(i: I) => GottenDefault<I, K, D> {
  return <I>(i: I) => {
    const castedI = i as DefaultHaver<I, K, D>;
    const found = castedI && castedI[k];
    if (found) {
      return found as GottenDefault<I, K, D>;
    }
    return d as GottenDefault<I, K, D>;
  };
}

const getAnyLogger = safeGetter<"logs", (a: any) => void>("logs", (a) => {
  console.log("base::xLog", a);
});

const getAnyWarner = safeGetter<"warns", (a: any) => void>("warns", (a) => {
  console.log("base::xWarn", a);
});

const getAnyErrorer = safeGetter<"error", (a: any) => void>("error", (a) => {
  console.log("base::xError", a);
});

const getAnyReader = safeGetter<"reads", {}>("reads", {});

export type X<R = void, E = never, I = any, A = never> = Generator<
  BaseXYields<E, A>,
  R,
  { i: I; a: any }
>;
export type X_<E = never, I = any, A = never> = X<never, E, I, A>;
export type X$<R = void, I = any, A = never> = X<R, never, I, A>;
export type X_$<I = any, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = any> = X<R, E, I, AsyncTag>;
export type Xa_<E = never, I = any> = X<never, E, I, AsyncTag>;
export type Xa$<R = void, I = any> = X<R, never, I, AsyncTag>;
export type Xa_$<I = any> = X<void, never, I, AsyncTag>;

export function* mapping<Rout, Rin, E, I, A>(
  vals: Rin[],
  f: (r: Rin, i: number) => X<Rout, E, I, A>,
): X<Rout[], E, I, A> {
  const res: Rout[] = [];
  let i = 0;
  for (const v of vals) {
    res.push(yield* f(v, i));
    i++;
  }
  return res;
}

function* getYield<E, I, A>(): X<{ i: I; a: any }, E, I, A> {
  return yield { Type: "BaseXYields", Variant: "Pass", Data: null };
}

function* getInternal<E, I, A>(): X<I, E, I, A> {
  const yn = yield* getYield();
  return yn.i;
}

function withInternal<I>(
  nextI: I,
): <R, E, A>(m: () => X<R, E, I, A>) => X<R, E, any, A> {
  return function* <R, E, A>(m: () => X<R, E, I, A>) {
    let yieldNext = yield* getYield();
    const it = m();
    while (true) {
      const result = it.next({ a: yieldNext.a, i: nextI });
      if (result.done) {
        return result.value;
      } else {
        yieldNext = yield result.value;
      }
    }
  };
}

export function* ask<E, I, A>(): X<GottenReads<I>, E, I, A> {
  const i = yield* getInternal();
  return getAnyReader(i);
}

export function* fail<R, E, I, A>(err: E): X<R, E, I, A> {
  yield { Type: "BaseXYields", Variant: "Err", Data: err };
  return undefined as any;
}

export function* pure<T, E, I, A>(t: T): X<T, E, I, A> {
  return t;
}

export function ok<R, E, I, A>(r: $.Result<R, E>): X<R, E, I, A> {
  return $.result$(r)(pure<R, E, I, A>, fail);
}

export function* trying<R, E, I, A>(
  m: () => X<R, E, I, A>,
  c: (e: unknown) => $.Result<R, E>,
): X<R, E, I, A> {
  try {
    return yield* m();
  } catch (e) {
    return yield* ok(c(e));
  }
}

function* f2(): X$<number, { b: number }> {
  const i = yield* getInternal();
  return i.b;
}

function* f1(): X$<number, { a: number }> {
  const i = yield* getInternal();
  const v2 = yield* withInternal({ b: i.a + 3, a: i.a })(f2);
  return i.a;
}
/*
X<I, E, I, A> {
  const yn = yield { Type: "BaseXYields", Variant: "Pass", Data: null };
  return yn.i;
}
*/
