import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";

class AsyncTag {}

export type Async = AsyncTag;

type Catcher<Err, Res> = (e: any) => undefined | $.Result<Res, Err>;

type CmdT<K extends "Pass" | "Fail" | "Get" | "Await", D> = D & { cmd: K };

type AssumedI = {
  logs: (l: any) => void;
  warns: (w: any) => void;
  errors: (e: any) => void;
  reads: {};
};

type FullI<I> = {
  logs: [I] extends [never]
    ? AssumedI["logs"]
    : I extends { logs: (l: any) => void }
      ? I["logs"]
      : AssumedI["logs"];
  warns: [I] extends [never]
    ? AssumedI["warns"]
    : I extends { warns: (l: any) => void }
      ? I["warns"]
      : AssumedI["warns"];
  errors: [I] extends [never]
    ? AssumedI["errors"]
    : I extends { errors: (l: any) => void }
      ? I["errors"]
      : AssumedI["errors"];
  reads: [I] extends [never]
    ? AssumedI["reads"]
    : I extends { reads: any }
      ? I["reads"]
      : AssumedI["reads"];
};

type BaseXYields<E, I, A> =
  | CmdT<"Pass", {}>
  | CmdT<"Get", { Proxy: Proxy.Of<FullI<I>> }>
  | CmdT<"Fail", { err: E }>
  | (A extends AsyncTag
      ? CmdT<
          "Await",
          {
            promise: Promise<unknown>;
            catcher?: Catcher<E, unknown>;
          }
        >
      : never);

type GottenDefault<I, K extends string, B, D = B> =
  I extends Record<K, B> ? ([I[K]] extends [never] ? D : I[K]) : D;
type DefaultHaver<I, K extends string, B> =
  | undefined
  | (I extends Record<K, B> ? I : Record<K, undefined>);

type BaseReads = Record<string, any>;
type EmptyReads = Record<string, undefined>;

function safeGetter<K extends string, B, D = B>(
  k: K,
  d: D,
): <I>(i: I) => GottenDefault<I, K, B, D> {
  return <I>(i: I) => {
    const castedI = i as DefaultHaver<I, K, B>;
    const found = castedI && castedI[k];
    if (found) {
      return found as GottenDefault<I, K, B, D>;
    }
    return d as GottenDefault<I, K, B, D>;
  };
}

const getAnyReader = safeGetter<"reads", BaseReads, EmptyReads>("reads", {});

export type X<R = void, E = never, I = never, A = never> = Generator<
  BaseXYields<E, I, A>,
  R,
  { i: FullI<I>; a: any }
>;
export type X_<E = never, I = never, A = never> = X<void, E, I, A>;
export type X$<R = void, I = never, A = never> = X<R, never, I, A>;
export type X_$<I = never, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = never> = X<R, E, I, AsyncTag>;
export type Xa_<E = never, I = never> = X<void, E, I, AsyncTag>;
export type Xa$<R = void, I = never> = X<R, never, I, AsyncTag>;
export type Xa_$<I = never> = X<void, never, I, AsyncTag>;

function* getYield<I>(): X$<{ i: FullI<I>; a: any }, I> {
  return yield { cmd: "Pass" };
}

function* getInternal<I>(): X$<FullI<I>, I> {
  const yn = yield* getYield();
  return yn.i;
}

function* withInternalMapped<I0, R, E, I, A>(
  maps: (i: FullI<I0>) => FullI<I>,
  m: () => X<R, E, I, A>,
): X<R, E, I0, A> {
  const currI = yield* getInternal();
  const nextI = maps(currI);
  let yieldNext = yield* getYield();
  const it = m();
  while (true) {
    const result = it.next({
      a: yieldNext.a,
      i: nextI,
    });
    if (result.done) {
      return result.value;
    } else {
      yieldNext = (yield result.value as any) as any;
    }
  }
}

export function* xPure<T>(t: T): X<T> {
  return t;
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

export function* xAsks<T, I>(f: (r: FullI<I>["reads"]) => T): X$<T, I> {
  const i = yield* getInternal();
  return f(i.reads);
}

export function* xAsk<I>(): X$<FullI<I>["reads"], I> {
  return yield* xAsks((r) => r);
}

export function* xRead<I, K extends keyof FullI<I>["reads"]>(
  k: K,
): X$<FullI<I>["reads"][K], I> {
  return yield* xAsks((r) => r[k]);
}

export function* xLog<I>(l: $.Param0<FullI<I>["logs"]>): X_$<I> {
  const i = yield* getInternal();
  i.logs(l);
}

export function* xWarns<I>(w: $.Param0<FullI<I>["warns"]>): X_$<I> {
  const i = yield* getInternal();
  i.warns(w);
}

export function* xErrors<I>(e: $.Param0<FullI<I>["errors"]>): X_$<I> {
  const i = yield* getInternal();
  i.errors(e);
}

type MergeRdr<Rdr, I> = $.Merge<
  I,
  { reads: I extends { reads: any } ? $.Merge<I["reads"], Rdr> : Rdr }
>;

export function xReads<Rdr, R, E, I, A>(
  reads: Rdr,
  m: () => X<R, E, MergeRdr<Rdr, I>, A>,
): X<R, E, I, A> {
  return withInternalMapped(
    (i0) =>
      Object.assign({}, i0, { reads: i0.reads }, { reads }) as FullI<
        MergeRdr<Rdr, I>
      >,
    m,
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

export function* xWait<Pt, Et>(
  mkPromise: () => Promise<Pt>,
  catcher: Catcher<Et, Pt> = () => undefined,
): Xa<Pt, Et> {
  const { a } = yield {
    cmd: "Await",
    promise: mkPromise(),
    catcher,
  };
  return a;
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

export function* xIntercept<R, E, I, A, Eout>(
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
        const promiseCatcher = v.catcher;
        const awaitYieldVal = {
          cmd: "Await",
          promise: v.promise,
          catcher: !promiseCatcher
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
        } as BaseXYields<Eout, I, A>;
        yieldNext = yield awaitYieldVal;
      } else {
        yieldNext = yield v;
      }
    }
  }
}

export function xResult<R, E, I, A>(
  x: X<R, E, I, A>,
): X<$.Result<R, E>, never, I, A> {
  return xIntercept(
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
  return xIntercept(x, (e) => $.Err(maps(e)));
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

function execRaw_2<R, E, I, A>(
  m: () => X<R, E, I, A>,
  _i: I,
): (onDone: (er: $.Result<R, E>) => void) => Promise<void> {
  return async (onDone) => {
    let awaited: any;
    const i: FullI<I> = Object.assign(
      {},
      {
        logs: (l: any) => console.log("base:xLog", l),
        warns: (l: any) => console.log("base:xLog", l),
        errors: (l: any) => console.log("base:xLog", l),
        reads: {},
      },
      _i,
    ) as FullI<I>;
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
          const { promise, catcher } = y;
          try {
            awaited = await promise;
          } catch (err) {
            if (!catcher) {
              throw err;
            }
            const caughtVal = catcher(err);
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
  m: () => X<R, E, Record<string, undefined>, A>,
): (onDone: (er: $.Result<R, E>) => void) => Promise<void> {
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

export function xMaybe<Mt>(
  mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>,
): $.Maybe<Mt> {
  const res = exec(() => mk((i) => xOk($.some(i))));
  if (res.Variant === "Ok") {
    return $.Some(res.Data);
  }
  return $.None();
}

export function* encapsulate<R, E, I, A, Args extends any[] = []>(
  m: (...args: Args) => X<R, E, I, A>,
): X$<(...args: Args) => X<R, E, Record<string, undefined>, A>, I> {
  const internal = yield* getInternal();
  return function (...args: Args) {
    return withInternalMapped(
      () => internal,
      () => m(...args),
    );
  };
}

abstract class Base_MX<
  Args extends any[] = [],
  R = void,
  E = never,
  I = never,
  A = never,
> {
  fail: typeof xFail<R, E> = xFail;
  args: Args;
  proxies: {
    Args: Proxy.Of<Args>;
    R: Proxy.Of<R>;
    E: Proxy.Of<E>;
    I: Proxy.Of<I>;
    A: Proxy.Of<A>;
    MX: Proxy.Of<Base_MX<Args, R, E, I, A>>;
    X: Proxy.Of<X<R, E, I, A>>;
  } = {
    Args: Proxy.Of<Args>(),
    R: Proxy.Of<R>(),
    E: Proxy.Of<E>(),
    I: Proxy.Of<I>(),
    A: Proxy.Of<A>(),
    MX: Proxy.Of<Base_MX<Args, R, E, I, A>>(),
    X: Proxy.Of<X<R, E, I, A>>(),
  };
  constructor(...args: Args) {
    this.args = args;
  }
  get ask(): X$<FullI<I>["reads"], I> {
    return xAsk();
  }
  $<Args extends any[], R, E, I, A>(
    MXConstructor: new (...args: Args) => MX<Args, R, E, I, A>,
    ...args: Args
  ): X<R, E, I, A> {
    return xDo(MXConstructor, ...args);
  }
  abstract do(): X<R, E, I, A>;
}

export abstract class MX<
  Args extends any[] = [],
  R = void,
  E = never,
  I = never,
  A = never,
> extends Base_MX<Args, R, E, I, A> {}
export abstract class MX_<
  Args extends any[] = [],
  E = never,
  I = never,
  A = never,
> extends Base_MX<Args, void, E, I, A> {}
export abstract class MX$<
  Args extends any[] = [],
  R = void,
  I = never,
  A = never,
> extends Base_MX<Args, R, never, I, A> {}
export abstract class MX_$<
  Args extends any[] = [],
  I = never,
  A = never,
> extends Base_MX<Args, void, never, I, A> {}

export abstract class MXa<
  Args extends any[] = [],
  R = void,
  E = never,
  I = never,
> extends Base_MX<Args, R, E, I, AsyncTag> {}
export abstract class MXa_<
  Args extends any[] = [],
  E = never,
  I = never,
> extends Base_MX<Args, void, E, I, AsyncTag> {}
export abstract class MXa$<
  Args extends any[] = [],
  R = void,
  I = never,
> extends Base_MX<Args, R, never, I, AsyncTag> {}
export abstract class MXa_$<Args extends any[] = [], I = never> extends Base_MX<
  Args,
  void,
  never,
  I,
  AsyncTag
> {}

export abstract class MX0<
  Args extends any[] = [],
  R = void,
  E = never,
  I = never,
  A = never,
> extends Base_MX<Args, R, E, I, A> {}
export abstract class MX_0<E = never, I = never, A = never> extends Base_MX<
  [],
  void,
  E,
  I,
  A
> {}
export abstract class MX$0<R = void, I = never, A = never> extends Base_MX<
  [],
  R,
  never,
  I,
  A
> {}
export abstract class MX_$0<I = never, A = never> extends Base_MX<
  [],
  void,
  never,
  I,
  A
> {}

export abstract class MXa0<R = void, E = never, I = never> extends Base_MX<
  [],
  R,
  E,
  I,
  AsyncTag
> {}
export abstract class MXa_0<E = never, I = never> extends Base_MX<
  [],
  void,
  E,
  I,
  AsyncTag
> {}
export abstract class MXa$0<R = void, I = never> extends Base_MX<
  [],
  R,
  never,
  I,
  AsyncTag
> {}
export abstract class MXa_$0<I = never> extends Base_MX<
  [],
  void,
  never,
  I,
  AsyncTag
> {}

export function mX<
  Args extends any[],
  R,
  E,
  I,
  A,
  MXI extends Base_MX<Args, R, E, I, A>,
>(MXConstructor: new (...args: Args) => MXI): (...args: Args) => X<R, E, I, A> {
  return (...args) => new MXConstructor(...args).do();
}

export function xDo<Args extends any[], R, E, I, A>(
  MXConstructor: new (...args: Args) => MX<Args, R, E, I, A>,
  ...args: Args
): X<R, E, I, A> {
  return mX<Args, R, E, I, A, MX<Args, R, E, I, A>>(MXConstructor)(...args);
}
