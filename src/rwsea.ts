import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";

type Merge<A, B> = Omit<A, keyof B> & B;

type BaseReader = {
  logs: (l: any) => void;
  warns: (l: any) => void;
};

type CatcherType<Err, Res> = (e: any) => undefined | $.Result<Res, Err>;

type XAwaitCmd<E> = {
  cmd: "AWAIT";
  val: Promise<unknown>;
  catcher?: CatcherType<E, unknown>;
};

type XYieldType<E, A extends boolean> =
  | { cmd: "GET" }
  | { cmd: "FAIL"; err: E }
  | (A extends false ? never : XAwaitCmd<E>);

type XNextType<R> = {
  reader: R;
  awaited: any;
};

type Xt<Res, E, R extends BaseReader, A extends boolean> = Generator<
  XYieldType<E, A>,
  Res,
  XNextType<R>
>;

type GetReader<X> = X extends Xt<any, any, infer R, any> ? R : never;
type OWReader<Rdr extends BaseReader, X> =
  X extends Xt<infer Res, infer Err, any, infer A>
    ? Xt<Res, Err, Rdr, A>
    : never;

export type Logs<L, X> = OWReader<
  Merge<GetReader<X>, { logs: (l: L) => void }>,
  X
>;
export type Warns<W, X> = OWReader<
  Merge<GetReader<X>, { logs: (l: W) => void }>,
  X
>;

export type X<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<
  Res,
  E,
  R,
  false
>;
export type X$<Res = void, R extends BaseReader = BaseReader> = Xt<
  Res,
  never,
  R,
  false
>;
export type X_<E = never, R extends BaseReader = BaseReader> = Xt<
  void,
  E,
  R,
  false
>;
export type X_$<R extends BaseReader = BaseReader> = Xt<void, never, R, false>;

type BaseG<R extends BaseReader, A extends boolean> = [R, A];
export type $X<Res, Err, R, A extends boolean> = Xt<
  Res,
  Err,
  Merge<BaseReader, R> extends BaseReader ? Merge<BaseReader, R> : BaseReader,
  A
>;
export type $Xs<Res, Err, R> = $X<Res, Err, R, false>;
export type $Xa<Res, Err, R> = $X<Res, Err, R, true>;
export type $Xg<Res, Err, G> =
  G extends BaseG<infer R, infer A>
    ? Xt<Res, Err, R, A>
    : Xt<Res, Err, BaseReader, boolean>;

export type Xa<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<
  Res,
  E,
  R,
  true
>;
export type Xa$<Res = void, R extends BaseReader = BaseReader> = Xt<
  Res,
  never,
  R,
  true
>;
export type Xa_<E = never, R extends BaseReader = BaseReader> = Xt<
  void,
  E,
  R,
  true
>;
export type Xa_$<R extends BaseReader = BaseReader> = Xt<void, never, R, true>;

export type Reads<R, X> = OWReader<Merge<GetReader<X>, { reads: R }>, X>;
export type Throws<Err, X> =
  X extends Xt<infer Res, any, infer Rdr, infer A>
    ? Xt<Res, Err, Rdr, A>
    : never;
/*
export type Sync<Err, X> =
  X extends Xt<infer Res, infer Err, infer Rdr>
    ? Xt<Res, Err, Rdr, false>
    : never;
    */

type MergeReaderObj<Rdr, Obj> = Merge<
  Rdr,
  { reads: Rdr extends { reads: any } ? Merge<Rdr["reads"], Obj> : Obj }
>;

export function readingWith<
  Obj,
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  obj: Obj,
  m: () => Xt<ResB, ErrB, MergeReaderObj<RdrB, Obj>, AB>,
): Xt<ResB, ErrB, RdrB, AB> {
  return _r(m, (rIn) =>
    Object.assign({}, rIn, {
      reads: Object.assign({}, ((rIn || {}) as any).reads, obj),
    }),
  );
}

export function* mapping<
  ROut,
  RIn,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  vals: RIn[],
  f: (r: RIn, i: number) => Xt<ROut, ErrB, RdrB, AB>,
): Xt<ROut[], ErrB, RdrB, AB> {
  const res: ROut[] = [];
  let i = 0;
  for (const v of vals) {
    res.push(yield* f(v, i));
    i++;
  }
  return res;
}
export function* trying<
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  m: () => Xt<ResB, ErrB, RdrB, AB>,
  c: (e: unknown) => $.Result<ResB, ErrB>,
): Xt<ResB, ErrB, RdrB, AB> {
  try {
    return yield* m();
  } catch (e) {
    return yield* ok(c(e));
  }
}

export function* catching<
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
  E,
>(
  m: () => Xt<ResB, ErrB, RdrB, AB>,
  c: (e: ErrB) => $.Result<ResB, E>,
): Xt<ResB, E, RdrB, AB> {
  let yieldNext = yield { cmd: "GET" };
  const it = m();
  while (true) {
    const result = it.next(yieldNext);
    if (result.done) {
      return result.value;
    } else {
      const v = result.value as XYieldType<ErrB, AB>;
      if (v.cmd === "FAIL") {
        const caught = c(v.err);
        if (caught.Variant === "Ok") {
          return caught.Data;
        } else {
          yieldNext = yield { cmd: "FAIL", err: caught.Data };
        }
      } else if (v.cmd === "AWAIT") {
        const promiseCatcher = v.catcher;
        const awaitYieldVal = {
          cmd: "AWAIT",
          val: v.val,
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
        } as XYieldType<E, AB>;
        yieldNext = yield awaitYieldVal;
      } else {
        yieldNext = yield v;
      }
    }
  }
}

function* _a<RdrB extends BaseReader>(): Xt<RdrB, never, RdrB, false> {
  const yieldNext = yield { cmd: "GET" };
  return yieldNext.reader;
}

function* _r<
  RdrI extends BaseReader,
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  m: () => Xt<ResB, ErrB, RdrI, AB>,
  f: (r: RdrB) => RdrI,
): Xt<ResB, ErrB, RdrB, AB> {
  let yieldNext = yield { cmd: "GET" };
  const reader = f(yieldNext.reader);
  const it = m();
  while (true) {
    const result = it.next({ ...yieldNext, reader });
    if (result.done) {
      return result.value;
    } else {
      const v = result.value as XYieldType<ErrB, AB>;
      yieldNext = yield v;
    }
  }
}

export function resulting<
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  m: () => Xt<ResB, ErrB, RdrB, AB>,
): Xt<$.Result<ResB, ErrB>, never, RdrB, AB> {
  return catching(
    function* () {
      const res = yield* m();
      return $.Ok(res) as $.Result<ResB, ErrB>;
    },
    (e) => $.Ok($.Err(e)),
  );
}

export function* fail<Et, Res>(err: Et): X<Res, Et> {
  yield { cmd: "FAIL", err };
  return undefined as any;
}

export function* ok<Ot, Et>(r: $.Result<Ot, Et>): X<Ot, Et> {
  if (r.Variant === "Ok") {
    return r.Data;
  }
  return yield* fail(r.Data);
}

export function* inverting<
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(m: () => Xt<ResB, ErrB, RdrB, AB>): Xt<ErrB, ResB, RdrB, AB> {
  const regular = yield* resulting(m);
  return yield* ok($.invertResult(regular));
}

export function firstOk<
  ResB,
  ErrB,
  RdrB extends BaseReader,
  AB extends boolean,
>(
  m1: () => Xt<ResB, ErrB, RdrB, AB>,
  ...ms: ((e: ErrB) => Xt<ResB, ErrB, RdrB, AB>)[]
): Xt<ResB, ErrB, RdrB, AB> {
  return inverting(function* () {
    let e = yield* inverting(m1);
    for (const m of ms) {
      e = yield* inverting(() => m(e));
    }
    return e;
  });
}

export function* xLog<L>(l: L): Logs<L, X> {
  const r = yield* _a();
  r.logs(l);
}

export function* xWarn<W>(w: W): Warns<W, X> {
  const r = yield* _a();
  r.warns(w);
}

export function* ask<R>(): Reads<R, X<R>> {
  const r = yield* _a();
  return r.reads;
}

export function* asks<R, Rt>(f: (r: R) => Rt): Reads<R, X<Rt>> {
  const r = yield* _a();
  return f(r.reads);
}

async function execRaw<ResB, ErrB, AB extends boolean>(
  m: () => Xt<ResB, ErrB, BaseReader, AB>,
  onDone: (er: $.Result<ResB, ErrB>) => void,
): Promise<void> {
  let awaited: any;
  const g = m();
  const reader = Object.assign(
    {},
    {
      logs: (l: any) => console.log("base:log", l),
      warns: (w: any) => console.warn("base:warn", w),
    },
  );
  while (true) {
    const result = g.next({ reader, awaited });
    if (result.done) {
      return onDone($.Ok(result.value));
    } else {
      const y = result.value as XYieldType<ErrB, AB>;
      if (y.cmd === "FAIL") {
        return onDone($.Err(y.err));
      } else if (y.cmd === "AWAIT") {
        try {
          awaited = await y.val;
        } catch (err) {
          if (!y.catcher) {
            throw err;
          }
          const caughtVal = y.catcher(err);
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
}

function exec_safe2<ResB, ErrB, RdrB extends BaseReader>(
  m: () => Xt<ResB, ErrB, RdrB, false>,
  d: Omit<RdrB, "logs" | "warns">,
): $.Result<ResB, ErrB> {
  let res: undefined | $.Result<ResB, ErrB> = undefined;
  execRaw(
    () => readingWith((d as any).reads, m as any),
    (finalRes) => (res = finalRes as any),
  );
  if (!res) {
    throw "non-terminated rwse monad";
  }
  return res;
}

function exec_safe1<ResB, ErrB>(
  m: () => Xt<
    ResB,
    ErrB,
    MergeReaderObj<BaseReader, Record<string, never>>,
    false
  >,
): $.Result<ResB, ErrB> {
  let res: undefined | $.Result<ResB, ErrB> = undefined;
  execRaw(
    () => readingWith({}, m as any),
    (finalRes) => (res = finalRes as any),
  );
  if (!res) {
    throw "non-terminated rwse monad";
  }
  return res;
}

type Exec_Fn<ResB, ErrB, RdrB extends BaseReader> =
  | typeof exec_safe1<ResB, ErrB>
  | typeof exec_safe2<ResB, ErrB, RdrB>;

export function exec<ResB, ErrB, RdrB extends BaseReader>(
  ...args: Parameters<Exec_Fn<ResB, ErrB, RdrB>>
): ReturnType<Exec_Fn<ResB, ErrB, RdrB>> {
  return args.length === 1 ? exec_safe1(...args) : exec_safe2(...args);
}

export function execAsync<ResB, ErrB>(
  m: () => Xt<ResB, ErrB, BaseReader, true>,
): Promise<$.Result<ResB, ErrB>> {
  return new Promise((resolve) => execRaw(m, resolve));
}

export function* Xawait<Pt, Et>(
  mkPromise: () => Promise<Pt>,
  catcher: CatcherType<Et, Pt> = () => undefined,
): Xa<Pt, Et> {
  const { awaited } = yield {
    cmd: "AWAIT",
    val: mkPromise(),
    catcher,
  };
  return awaited;
}

export function maybe<Mt>(
  mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>,
): $.Maybe<Mt> {
  const res = exec(() => mk((i) => ok($.some(i))));
  if (res.Variant === "Ok") {
    return $.Some(res.Data);
  }
  return $.None();
}

export function* pure<T>(t: T): X<T> {
  yield { cmd: "GET" };
  return t;
}

type ReadType<Rdr> = Rdr extends { reads: any } ? Rdr["reads"] : never;

type Fn0<R> = () => R;
type Fn1<A, R> = (a: A) => R;

type ThisX<Err, Rdr extends BaseReader, A extends boolean> = {
  proxy: Proxy.Of<[Err, Rdr, A]>;
  ask: Xt<ReadType<Rdr>, never, Rdr, false>;
  resumable: Xt<
    <SRes, SErr>(
      x: Fn0<Xt<SRes, SErr, Rdr, A>>,
    ) => Xt<SRes, SErr, BaseReader, A>,
    never,
    Rdr,
    false
  >;
  asks: <Res>(f: (r: ReadType<Rdr>) => Res) => Xt<Res, never, Rdr, false>;
  reading<Obj, Res>(
    o: Obj,
    m: (
      this: ThisX<Err, MergeReaderObj<Rdr, Obj>, A>,
    ) => Xt<Res, Err, MergeReaderObj<Rdr, Obj>, A>,
  ): Xt<Res, Err, Rdr, A>;
  trying<Res>(
    m: (this: ThisX<Err, Rdr, A>) => Xt<Res, Err, Rdr, A>,
    c: (e: unknown) => $.Result<Res, Err>,
  ): Xt<Res, Err, Rdr, A>;
  fn: <FnArgs extends any[], FnRes>(
    f: (this: ThisX<Err, Rdr, A>, ...args: FnArgs) => Xt<FnRes, Err, Rdr, A>,
  ) => (...args: FnArgs) => Xt<FnRes, Err, Rdr, A>;
};

export function X<
  Args extends any[],
  Res,
  Err,
  Rdr extends BaseReader,
  A extends boolean,
>(
  f: (this: ThisX<Err, Rdr, A>, ...args: Args) => Xt<Res, Err, Rdr, A>,
): (...args: Args) => Xt<Res, Err, Rdr, A> {
  const xThis: ThisX<Err, Rdr, A> = {
    get resumable() {
      return (function* (): Xt<
        <SRes, SErr>(
          x: Fn0<Xt<SRes, SErr, Rdr, A>>,
        ) => Xt<SRes, SErr, BaseReader, A>,
        never,
        Rdr,
        false
      > {
        const { reader } = yield { cmd: "GET" };
        return function* <SRes, SErr>(
          m: Fn0<Xt<SRes, SErr, Rdr, A>>,
        ): Xt<SRes, SErr, Rdr, A> {
          return yield* _r(m, () => reader);
        };
      })();
    },
    get ask() {
      return (function* (): Xt<ReadType<Rdr>, never, Rdr, never> {
        const r = yield { cmd: "GET" };
        return (r.reader as any).reads;
      })();
    },
    asks: function* (f) {
      const r = yield* xThis.ask;
      return f(r);
    },
    proxy: Proxy.Of<[Err, Rdr, A]>(),
    reading: <Obj, Res>(
      o: Obj,
      m: (
        this: ThisX<Err, MergeReaderObj<Rdr, Obj>, A>,
      ) => Xt<Res, Err, MergeReaderObj<Rdr, Obj>, A>,
    ) => readingWith(o, X(m)),
    trying: (m, c) => trying(m, c),
    fn: (f) => X(f),
  };
  return f.bind(xThis);
}

export function parseT<ZT extends T.ZodType>(
  z: ZT,
  u: unknown,
): X<T.infer<ZT>, T.ZodError> {
  const parsed = z.safeParse(u);
  return ok(parsed.success ? $.Ok(parsed.data) : $.Err(parsed.error));
}
