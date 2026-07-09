import * as $ from "./core.js";
import * as T from "./T.js";
import * as Proxy from "./proxy.js";

class AsyncTag {}

export type Async = AsyncTag;

type CatchFn<Res, Err> = (e: any) => undefined | $.Result<Res, Err>;

type CmdT<K extends "Pass" | "Fail" | "Await", D> = D & { cmd: K };

type BaseInternal = {
  logInfo: (a: any) => void;
  logWarning: (a: any) => void;
  logError: (a: any) => void;
  reads: {};
  /*
  emits: {};
  writes: {};
  states: {};
  */
};

const BaseInternal: BaseInternal = {
  logInfo: (a: any) => console.log("{xLog}::info", a),
  logWarning: (a: any) => console.warn("{xLog}::warning", a),
  logError: (a: any) => console.error("{xLog}::error", a),
  reads: {},
  /*
  writes: {},
  states: {},
  emits: {},
  */
};

type TrueI<I> = {
  logInfo: [I] extends [never]
    ? BaseInternal["logInfo"]
    : I extends { l: { i: any } }
      ? (a: I["l"]["i"]) => void
      : BaseInternal["logInfo"];
  logWarning: [I] extends [never]
    ? BaseInternal["logWarning"]
    : I extends { l: { w: any } }
      ? (a: I["l"]["w"]) => void
      : BaseInternal["logWarning"];
  logError: [I] extends [never]
    ? BaseInternal["logError"]
    : I extends { l: { e: any } }
      ? (a: I["l"]["e"]) => void
      : BaseInternal["logError"];
  reads: [I] extends [never]
    ? BaseInternal["reads"]
    : I extends { r: {} }
      ? I["r"]
      : BaseInternal["reads"];
};

type BaseXYields<E, A> =
  | CmdT<"Pass", {}>
  | CmdT<"Fail", { err: E }>
  | (A extends AsyncTag
      ? CmdT<"Await", { p: Promise<unknown>; c?: CatchFn<unknown, E> }>
      : never);

type BaseX<R, E, TrueInternal, A> = Generator<
  BaseXYields<E, A>,
  R,
  { i: TrueInternal; a: any }
>;

export type X<R = void, E = never, I = never, A = never> = BaseX<
  R,
  E,
  TrueI<I>,
  A
>;
export type X_<E = never, I = never, A = never> = X<void, E, I, A>;
export type X$<R = void, I = never, A = never> = X<R, never, I, A>;
export type X_$<I = never, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = never> = X<R, E, I, Async>;
export type Xa_<E = never, I = never> = X<void, E, I, Async>;
export type Xa$<R = void, I = never> = X<R, never, I, Async>;
export type Xa_$<I = never> = X<void, never, I, Async>;

function execRaw_2<R, E, Iinit, A>(
  m: () => BaseX<R, E, $.Merge<BaseInternal, Iinit>, A>,
  iInit: Iinit,
): (onDone: (er: $.Result<R, E>) => void) => Promise<void> {
  return async (onDone) => {
    let awaited: any;
    const i: $.Merge<BaseInternal, Iinit> = Object.assign(
      {},
      BaseInternal,
      iInit,
    );
    const g = m();
    while (true) {
      const result = g.next({ i, a: awaited });
      if (result.done) {
        return onDone($.Ok(result.value));
      } else {
        const y = result.value;
        if (y.cmd === "Fail") {
          return onDone($.Err(y.err));
        } else if (y.cmd === "Await") {
          const { p, c } = y;
          try {
            awaited = await p;
          } catch (err) {
            if (!c) {
              throw err;
            }
            const caughtVal = c(err);
            if (!caughtVal) {
              throw err;
            } else if (caughtVal.Variant === "Err") {
              return onDone($.Err(caughtVal.Data));
            } else {
              awaited = caughtVal.Data;
            }
          }
        }
      }
    }
  };
}

function execRaw_1<R, E, A>(
  m: $.Param0<typeof execRaw_2<R, E, {}, A>>,
): ReturnType<typeof execRaw_2<R, E, {}, A>> {
  return execRaw_2(m, {});
}

type Exec_Raw_Fn<R, E, I, A> =
  | typeof execRaw_1<R, E, A>
  | typeof execRaw_2<R, E, I, A>;

function execRaw<R, E, I, A>(
  ...args: Parameters<Exec_Raw_Fn<R, E, I, A>>
): ReturnType<Exec_Raw_Fn<R, E, I, A>> {
  return args.length === 1 ? execRaw_1(...args) : execRaw_2(...args);
}

export function execAsync<R, E, I>(
  ...args: Parameters<Exec_Raw_Fn<R, E, I, AsyncTag>>
): Promise<$.Result<R, E>> {
  return new Promise((resolve) => execRaw<R, E, I, AsyncTag>(...args)(resolve));
}

export function exec<R, E, I>(
  ...args: Parameters<Exec_Raw_Fn<R, E, I, never>>
): $.Result<R, E> {
  let res: undefined | $.Result<R, E> = undefined;
  execRaw(...args)((r) => (res = r));
  if (!res) {
    throw "non-terminated rwse monad";
  }
  return res;
}

export function xPure<T>(t: T): Generator<any, T> {
  return (function* () {
    return t;
  })();
}

export function* xFail<R, E>(err: E): X<R, E> {
  yield { cmd: "Fail", err };
  return undefined as any;
}

export function xOk<R, E>(r: $.Result<R, E>): X<R, E> {
  return $.result$(r)(
    (s) => xPure(s),
    (e) => xFail(e),
  );
}

export function* xTry<R, E, I, A>(
  m: () => X<R, E, I, A>,
  c: (e: unknown) => $.Result<R, E>,
): X<R, E, I, A> {
  try {
    return yield* m();
  } catch (e) {
    return yield* xOk<R, E>(c(e));
  }
}

function* base_xAwait<Pt, Et>(
  mkPromise: () => Promise<Pt>,
  catcher?: CatchFn<Pt, Et> | undefined,
): Xa<Pt, Et> {
  const { a } = yield {
    cmd: "Await",
    p: mkPromise(),
    ...(catcher ? { c: catcher } : {}),
  };
  return a;
}

export function xAwait<Pt, Et>(
  mkPromise: () => Promise<Pt>,
  catcher: CatchFn<Pt, Et>,
): Xa<Pt, Et>;
export function xAwait<Pt, Et>(mkPromise: () => Promise<Pt>): Xa<Pt>;
export function xAwait(...args: [any] | [any, any]): any {
  return base_xAwait(args[0], args[1]);
}

export function* xThen<R1, R2, E, I, A>(
  m1: X<R1, E, I, A>,
  m2: (r: R1) => X<R2, E, I, A>,
): X<R2, E, I, A> {
  const r1 = yield* m1;
  return yield* m2(r1);
}

export function xParse<ZT extends T.ZodType>(
  z: ZT,
  u: unknown,
): X<T.infer<ZT>, T.ZodError> {
  const parsed = z.safeParse(u);
  return xOk(parsed.success ? $.Ok(parsed.data) : $.Err(parsed.error));
}

export function xResult<R, E, I, A>(
  x: X<R, E, I, A>,
): X<$.Result<R, E>, never, I, A> {
  return xCatch(
    $.immediate(function* () {
      const res = yield* x;
      return $.Ok(res) as $.Result<R, E>;
    }),
    (e) => $.Ok($.Err(e)),
  );
}

export function* xInvert<R, E, I, A>(x: X<R, E, I, A>): X<E, R, I, A> {
  const regular = yield* xResult(x);
  return yield* xOk($.invertResult(regular));
}

export function* xMap<Rout, Rin, E, I, A>(
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

export function xMapErr<Eout, R, Ein, I, A>(
  x: X<R, Ein, I, A>,
  maps: (e: Ein) => Eout,
): X<R, Eout, I, A> {
  return xCatch(x, (e) => $.Err(maps(e)));
}

export function xFirst<R, E, I, A>(
  m1: () => X<R, E, I, A>,
  ...ms: ((e: E) => X<R, E, I, A>)[]
): X<R, E, I, A> {
  return xInvert(
    $.immediate(function* () {
      let e = yield* xInvert(m1());
      for (const m of ms) {
        e = yield* xInvert(m(e));
      }
      return e;
    }),
  );
}

export function* xCatch<R, E, I, A, Eout>(
  x: X<R, E, I, A>,
  c: (e: E) => $.Result<R, Eout>,
): X<R, Eout, I, A> {
  let yieldNext = yield { cmd: "Pass" };
  const it = x;
  while (true) {
    const result = it.next(yieldNext);
    if (result.done) {
      return result.value;
    } else {
      const v = result.value;
      if (v.cmd === "Fail") {
        const caught = c(v.err);
        if (caught.Variant === "Ok") {
          return caught.Data;
        } else {
          yieldNext = yield { cmd: "Fail", err: caught.Data };
        }
      } else if (v.cmd === "Await") {
        const promiseCatcher = v.c;
        const awaitYieldVal = {
          cmd: "Await",
          p: v.p,
          c: !promiseCatcher
            ? undefined
            : (e) => {
                const i = promiseCatcher(e);
                if (!i) {
                  return undefined;
                } else if (i.Variant === "Ok") {
                  return $.Ok(i.Data);
                } else {
                  return c(i.Data);
                }
              },
        } as BaseXYields<Eout, A>;
        yieldNext = yield awaitYieldVal;
      } else {
        yieldNext = yield v;
      }
    }
  }
}

export function genMaybe<Mt>(
  mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>,
): $.Maybe<Mt> {
  const res = exec(() => mk((i) => xOk($.some(i))));
  if (res.Variant === "Ok") {
    return $.Some(res.Data);
  }
  return $.None();
}

type RawFnX<Args extends any[], R = void, E = never, I = never, A = never> = (
  ...args: Args
) => X<R, E, I, A>;

type MergeR<D, I> = $.Merge<
  I,
  {
    r: I extends { r: infer R }
      ? [R] extends [never]
        ? D
        : $.Merge<I["r"], D>
      : D;
  }
>;

export class ClassX<I = never, A = never> {
  proxies: {
    I: Proxy.Of<I>;
    A: Proxy.Of<A>;
  } = {
    I: Proxy.Of<I>(),
    A: Proxy.Of<A>(),
  };
  fn: <Args extends any[] = [], R = void, E = never>(
    f: (this: ClassX<I, A>, ...args: Args) => X<R, E, I, A>,
  ) => FnX<Args, R, E, I, A> = FnX;
  *#getYield(): X$<{ a: any; i: TrueI<I> }, I> {
    return yield { cmd: "Pass" };
  }
  *#getI(): X$<TrueI<I>, I> {
    const yieldVal = yield* this.#getYield();
    return yieldVal.i;
  }
  *#ask(): X$<TrueI<I>["reads"], I> {
    const i = yield* this.#getI();
    return i.reads;
  }

  get ask(): X$<TrueI<I>["reads"], I> {
    return this.#ask();
  }

  *asks<R>(f: (a: TrueI<I>["reads"]) => R): X$<R, I> {
    const a = yield* this.#ask();
    return f(a);
  }

  *reading<D, R, E>(d: D, x: X<R, E, MergeR<D, I>, A>): X<R, E, I, A> {
    const currI = yield* this.#getI();
    const newReads = Object.assign({}, currI.reads, d);
    const newI: TrueI<MergeR<D, I>> = Object.assign({}, currI, {
      reads: newReads,
    }) as TrueI<MergeR<D, I>>;
    let yieldNext = yield* this.#getYield();
    const it = x;
    while (true) {
      const result = it.next({
        a: yieldNext.a,
        i: newI,
      });
      if (result.done) {
        return result.value;
      } else {
        yieldNext = (yield result.value as any) as any;
      }
    }
  }
  *logInfo(a: $.Param0<TrueI<I>["logInfo"]>): X_$<I> {
    const i = yield* this.#getI();
    i.logInfo(a);
  }
  *logWarning(a: $.Param0<TrueI<I>["logWarning"]>): X_$<I> {
    const i = yield* this.#getI();
    i.logWarning(a);
  }
  *logError(a: $.Param0<TrueI<I>["logError"]>): X_$<I> {
    const i = yield* this.#getI();
    i.logError(a);
  }
  pure: typeof xPure = xPure;
  fail: typeof xFail = xFail;
  ok: typeof xOk = xOk;
  await: A extends AsyncTag ? typeof xAwait : never =
    xAwait as A extends AsyncTag ? typeof xAwait : never;
  first: <R, E>(
    ...args: Parameters<typeof xFirst<R, E, I, A>>
  ) => ReturnType<typeof xFirst<R, E, I, A>> = xFirst;
  result: <R, E>(
    ...args: Parameters<typeof xResult<R, E, I, A>>
  ) => ReturnType<typeof xResult<R, E, I, A>> = xResult;
  invert: <R, E>(
    ...args: Parameters<typeof xInvert<R, E, I, A>>
  ) => ReturnType<typeof xInvert<R, E, I, A>> = xInvert;
  map: <Rout, Rin, E>(
    ...args: Parameters<typeof xMap<Rout, Rin, E, I, A>>
  ) => ReturnType<typeof xMap<Rout, Rin, E, I, A>> = xMap;
  mapErr: <Eout, R, Ein>(
    ...args: Parameters<typeof xMapErr<Eout, R, Ein, I, A>>
  ) => ReturnType<typeof xMapErr<Eout, R, Ein, I, A>> = xMapErr;
  try: <R, E>(
    ...args: Parameters<typeof xTry<R, E, I, A>>
  ) => ReturnType<typeof xTry<R, E, I, A>> = xTry;
  then: <R1, R2, E>(
    ...args: Parameters<typeof xThen<R1, R2, E, I, A>>
  ) => ReturnType<typeof xThen<R1, R2, E, I, A>> = xThen;
  catch: <R, E, Eout>(
    ...args: Parameters<typeof xCatch<R, E, I, A, Eout>>
  ) => ReturnType<typeof xCatch<R, E, I, A, Eout>> = xCatch;
  $$<Args extends any[], R, E>(
    Cons: new () => $X<Args, R, E, I, A>,
  ): (...args: Args) => X<R, E, I, A> {
    return (...args) => new Cons().$(...args);
  }
  use<T extends ClassX<I, A>>(Cons: new () => T): Omit<T, keyof ClassX<I, A>> {
    return new Cons();
  }
}
export class ClassXa<I = never> extends ClassX<I, AsyncTag> {}

export function xReading<D, R, E, I, A>(
  d: D,
  x: X<R, E, MergeR<D, I>, A>,
): X<R, E, I, A> {
  return new ClassX<I, A>().reading(d, x);
}

export function FnX<Args extends any[], R, E, I, A>(
  f: (this: ClassX<I, A>, ...args: Args) => X<R, E, I, A>,
): FnX<Args, R, E, I, A> {
  return (...args) => f.bind(new ClassX<I, A>())(...args);
}

const t: Fn0XOk<number, { r: { a: number } }> = FnX(function* (): ReturnType<
  typeof t
> {
  return 2;
});

const t2: FnXOk<[number], number, { r: { a: number } }> = FnX(function* (a) {
  const helper = this.fn(function* (b: number) {
    // const [b2] = this.args;
    return yield* this.pure(b * 2);
  });
  const mult = yield* helper(2);
  const r = yield* this.ask;
  return mult * a * r.a;
});

const ts: Fn0Xa<
  string,
  $.Maybe<{ a: number }> | string | $.Result<number, string>
> = FnX(function* () {
  return yield* xAwait(() => Promise.resolve("Hello"));
});

export type FnX<
  Args extends any[],
  R = void,
  E = never,
  I = never,
  A = never,
> = RawFnX<Args, R, E, I, A>;
export type FnX_<
  Args extends any[] = [],
  E = never,
  I = never,
  A = never,
> = RawFnX<Args, void, E, I, A>;
export type FnXOk<Args extends any[], R = void, I = never, A = never> = RawFnX<
  Args,
  R,
  never,
  I,
  A
>;
export type FnX_Ok<Args extends any[], I = never, A = never> = RawFnX<
  Args,
  void,
  never,
  I,
  A
>;

export type FnXa<Args extends any[], R = void, E = never, I = never> = RawFnX<
  Args,
  R,
  E,
  I,
  Async
>;
export type FnXa_<Args extends any[] = [], E = never, I = never> = RawFnX<
  Args,
  void,
  E,
  I,
  Async
>;
export type FnXaOk<Args extends any[], R = void, I = never> = RawFnX<
  Args,
  R,
  never,
  I,
  Async
>;
export type FnXa_Ok<Args extends any[], I = never> = RawFnX<
  Args,
  void,
  never,
  I,
  Async
>;

export type Fn0X<R = void, E = never, I = never, A = never> = RawFnX<
  [],
  R,
  E,
  I,
  A
>;
export type Fn0X_<E = never, I = never, A = never> = RawFnX<[], void, E, I, A>;
export type Fn0XOk<R = void, I = never, A = never> = RawFnX<[], R, never, I, A>;
export type Fn0X_Ok<I = never, A = never> = RawFnX<[], void, never, I, A>;

export type Fn0Xa<R = void, E = never, I = never> = RawFnX<[], R, E, I, Async>;
export type Fn0Xa_<E = never, I = never> = RawFnX<[], void, E, I, Async>;
export type Fn0XaOk<R = void, I = never> = RawFnX<[], R, never, I, Async>;
export type Fn0Xa_Ok<I = never> = RawFnX<[], void, never, I, Async>;

export abstract class $X<
  Args extends any[] = [],
  R = void,
  E = never,
  I = never,
  A = never,
> extends ClassX<I, A> {
  abstract $(...args: Args): X<R, E, I, A>;
}
export abstract class $X_<
  Args extends any[],
  E = never,
  I = never,
  A = never,
> extends $X<Args, void, E, I, A> {}
export abstract class $XOk<
  Args extends any[],
  R = void,
  I = never,
  A = never,
> extends $X<Args, R, never, I, A> {}
export abstract class $X_Ok<
  Args extends any[],
  I = never,
  A = never,
> extends $X<Args, void, never, I, A> {}

export abstract class $Xa<
  Args extends any[],
  R = void,
  E = never,
  I = never,
> extends $X<Args, R, E, I, Async> {}
export abstract class $Xa_<Args extends any[], E = never, I = never> extends $X<
  Args,
  void,
  E,
  I,
  Async
> {}
export abstract class $XaOk<Args extends any[], R = void, I = never> extends $X<
  Args,
  R,
  never,
  I,
  Async
> {}
export abstract class $Xa_Ok<Args extends any[], I = never> extends $X<
  Args,
  void,
  never,
  I,
  Async
> {}

export abstract class $0X<R = void, E = never, I = never, A = never> extends $X<
  [],
  R,
  E,
  I,
  A
> {}
export abstract class $0X_<E = never, I = never, A = never> extends $X<
  [],
  void,
  E,
  I,
  A
> {}
export abstract class $0XOk<R = void, I = never, A = never> extends $X<
  [],
  R,
  never,
  I,
  A
> {}
export abstract class $0X_Ok<I = never, A = never> extends $X<
  [],
  void,
  never,
  I,
  A
> {}

export abstract class $0Xa<R = void, E = never, I = never> extends $X<
  [],
  R,
  E,
  I,
  Async
> {}
export abstract class $0Xa_<E = never, I = never> extends $X<
  [],
  void,
  E,
  I,
  Async
> {}
export abstract class $0XaOk<R = void, I = never> extends $X<
  [],
  R,
  never,
  I,
  Async
> {}
export abstract class $0Xa_Ok<I = never> extends $X<
  [],
  void,
  never,
  I,
  Async
> {}

export function xPipe<E, I, As, A>(value: X<A, E, I, As>): X<A, E, I, As>;
export function xPipe<E, I, As, A, B>(
  value: X<A, E, I, As>,
  fn1: (arg: A) => X<B, E, I, As>,
): X<B, E, I, As>;
export function xPipe<Er, In, As, A, B, C>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
): X<C, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
): X<D, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
): X<E, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
): X<F, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F, G>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
  fn6: (arg: F) => X<G, Er, In, As>,
): X<F, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F, G, H>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
  fn6: (arg: F) => X<G, Er, In, As>,
  fn7: (arg: G) => X<H, Er, In, As>,
): X<F, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F, G, H, I>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
  fn6: (arg: F) => X<G, Er, In, As>,
  fn7: (arg: G) => X<H, Er, In, As>,
  fn8: (arg: H) => X<I, Er, In, As>,
): X<F, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F, G, H, I, J>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
  fn6: (arg: F) => X<G, Er, In, As>,
  fn7: (arg: G) => X<H, Er, In, As>,
  fn8: (arg: H) => X<I, Er, In, As>,
  fn9: (arg: I) => X<J, Er, In, As>,
): X<J, Er, In, As>;
export function xPipe<Er, In, As, A, B, C, D, E, F, G, H, I, J, K>(
  value: X<A, Er, In, As>,
  fn1: (arg: A) => X<B, Er, In, As>,
  fn2: (arg: B) => X<C, Er, In, As>,
  fn3: (arg: C) => X<D, Er, In, As>,
  fn4: (arg: D) => X<E, Er, In, As>,
  fn5: (arg: E) => X<F, Er, In, As>,
  fn6: (arg: F) => X<G, Er, In, As>,
  fn7: (arg: G) => X<H, Er, In, As>,
  fn8: (arg: H) => X<I, Er, In, As>,
  fn9: (arg: I) => X<J, Er, In, As>,
  fn10: (arg: J) => X<K, Er, In, As>,
): X<K, Er, In, As>;
export function* xPipe(
  value: Generator<any, any, any>,
  ...fns: ((a: any) => Generator<any, any, any>)[]
): any {
  let acc = yield* value;
  for (const fn of fns) {
    acc = yield* fn(acc);
  }
  return acc;
}
