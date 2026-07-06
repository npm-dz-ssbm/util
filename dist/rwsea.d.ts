import * as $ from "./core.js";
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
type XYieldType<E, A extends boolean> = {
    cmd: "GET";
} | {
    cmd: "FAIL";
    err: E;
} | (A extends false ? never : XAwaitCmd<E>);
type XNextType<R> = {
    reader: R;
    awaited: any;
};
type GetReader<X> = X extends Generator<any, any, {
    reader: infer R;
}> ? R : never;
type OWReader<Rdr, X> = X extends Generator<infer Y, infer Res, any> ? Generator<Y, Res, XNextType<Rdr>> : never;
export type Logs<L, X> = OWReader<Merge<GetReader<X>, {
    logs: (l: L) => void;
}>, X>;
export type Warns<W, X> = OWReader<Merge<GetReader<X>, {
    logs: (l: W) => void;
}>, X>;
export type Reads<R, X> = OWReader<Merge<GetReader<X>, {
    reads: R;
}>, X>;
type Xt<Res, E, R extends BaseReader, A extends boolean> = Generator<XYieldType<E, A>, Res, XNextType<R>>;
export type X<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<Res, E, R, false>;
export type X$<Res = void, R extends BaseReader = BaseReader> = Xt<Res, never, R, false>;
export type X_<E = never, R extends BaseReader = BaseReader> = Xt<void, E, R, false>;
export type X_$<R extends BaseReader = BaseReader> = Xt<void, never, R, false>;
export type Xa<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<Res, E, R, true>;
export type Xa$<Res = void, R extends BaseReader = BaseReader> = Xt<Res, never, R, true>;
export type Xa_<E = never, R extends BaseReader = BaseReader> = Xt<void, E, R, true>;
export type Xa_$<R extends BaseReader = BaseReader> = Xt<void, never, R, true>;
type MergeReaderObj<Rdr, Obj> = Merge<Rdr, {
    reads: Rdr extends {
        reads: any;
    } ? Merge<Rdr["reads"], Obj> : Obj;
}>;
export declare function mapping<ROut, RIn, ErrB, RdrB extends BaseReader, AB extends boolean>(vals: RIn[], f: (r: RIn, i: number) => Xt<ROut, ErrB, RdrB, AB>): Xt<ROut[], ErrB, RdrB, AB>;
export declare function trying<ResB, ErrB, RdrB extends BaseReader, AB extends boolean>(m: () => Xt<ResB, ErrB, RdrB, AB>, c: (e: unknown) => $.Result<ResB, ErrB>): Xt<ResB, ErrB, RdrB, AB>;
export declare function catching<ResB, ErrB, RdrB extends BaseReader, AB extends boolean, E>(m: () => Xt<ResB, ErrB, RdrB, AB>, c: (e: ErrB) => $.Result<ResB, E>): Xt<ResB, E, RdrB, AB>;
export declare function resulting<ResB, ErrB, RdrB extends BaseReader, AB extends boolean>(m: () => Xt<ResB, ErrB, RdrB, AB>): Xt<$.Result<ResB, ErrB>, never, RdrB, AB>;
export declare function fail<Et, Res>(err: Et): X<Res, Et>;
export declare function ok<Ot, Et>(r: $.Result<Ot, Et>): X<Ot, Et>;
export declare function inverting<ResB, ErrB, RdrB extends BaseReader, AB extends boolean>(m: () => Xt<ResB, ErrB, RdrB, AB>): Xt<ErrB, ResB, RdrB, AB>;
export declare function firstOk<ResB, ErrB, RdrB extends BaseReader, AB extends boolean>(m1: () => Xt<ResB, ErrB, RdrB, AB>, ...ms: ((e: ErrB) => Xt<ResB, ErrB, RdrB, AB>)[]): Xt<ResB, ErrB, RdrB, AB>;
export declare function xLog<L>(l: L): Logs<L, X>;
export declare function xWarn<W>(w: W): Warns<W, X>;
export declare function ask<R>(): Reads<R, X<R>>;
export declare function asks<R, Rt>(f: (r: R) => Rt): Reads<R, X<Rt>>;
export declare function exec<ResB, ErrB>(m: () => Xt<ResB, ErrB, BaseReader, false>): $.Result<ResB, ErrB>;
export declare function execAsync<ResB, ErrB>(m: () => Xt<ResB, ErrB, BaseReader, true>): Promise<$.Result<ResB, ErrB>>;
export declare function Xawait<Pt, Et>(mkPromise: () => Promise<Pt>, catcher?: CatcherType<Et, Pt>): Xa<Pt, Et>;
export declare function maybe<Mt>(mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>): $.Maybe<Mt>;
export declare function pure<T>(t: T): X<T>;
type ReadType<Rdr> = Rdr extends {
    reads: any;
} ? Rdr["reads"] : never;
type ThisX<Err, Rdr extends BaseReader, A extends boolean> = {
    proxy: Proxy.Of<[Err, Rdr, A]>;
    ask: Xt<ReadType<Rdr>, never, Rdr, false>;
    asks: <Res>(f: (r: ReadType<Rdr>) => Res) => Xt<Res, never, Rdr, false>;
    reading<Obj, Res>(o: Obj, m: (this: ThisX<Err, MergeReaderObj<Rdr, Obj>, A>) => Xt<Res, Err, MergeReaderObj<Rdr, Obj>, A>): Xt<Res, Err, Rdr, A>;
    trying<Res>(m: (this: ThisX<Err, Rdr, A>) => Xt<Res, Err, Rdr, A>, c: (e: unknown) => $.Result<Res, Err>): Xt<Res, Err, Rdr, A>;
    fn: <FnArgs extends any[], FnRes>(f: (this: ThisX<Err, Rdr, A>, ...args: FnArgs) => Xt<FnRes, Err, Rdr, A>) => (...args: FnArgs) => Xt<FnRes, Err, Rdr, A>;
};
export declare function X<Args extends any[], Res, Err, Rdr extends BaseReader, A extends boolean>(f: (this: ThisX<Err, Rdr, A>, ...args: Args) => Xt<Res, Err, Rdr, A>): (...args: Args) => Xt<Res, Err, Rdr, A>;
export {};
//# sourceMappingURL=rwsea.d.ts.map