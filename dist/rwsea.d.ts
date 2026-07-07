import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";
type Merge<A, B> = Omit<A, keyof B> & B;
type BaseReader = {
    logs: (l: any) => void;
    warns: (l: any) => void;
};
export type I = BaseReader;
export type A = boolean;
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
export type Xt<Res, E, R extends BaseReader, A extends boolean> = Generator<XYieldType<E, A>, Res, XNextType<R>>;
type GetReader<X> = X extends Xt<any, any, infer R, any> ? R : never;
type OWReader<Rdr extends BaseReader, X> = X extends Xt<infer Res, infer Err, any, infer A> ? Xt<Res, Err, Rdr, A> : never;
export type Logs<L, X> = OWReader<Merge<GetReader<X>, {
    logs: (l: L) => void;
}>, X>;
export type Warns<W, X> = OWReader<Merge<GetReader<X>, {
    logs: (l: W) => void;
}>, X>;
export type X<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<Res, E, R, false>;
export type X$<Res = void, R extends BaseReader = BaseReader> = Xt<Res, never, R, false>;
export type X_<E = never, R extends BaseReader = BaseReader> = Xt<void, E, R, false>;
export type X_$<R extends BaseReader = BaseReader> = Xt<void, never, R, false>;
type BaseG<R extends BaseReader, A extends boolean> = [R, A];
export type $X<Res, Err, R, A extends boolean> = Xt<Res, Err, Merge<BaseReader, R> extends BaseReader ? Merge<BaseReader, R> : BaseReader, A>;
export type $Xs<Res, Err, R> = $X<Res, Err, R, false>;
export type $Xa<Res, Err, R> = $X<Res, Err, R, true>;
export type $Xg<Res, Err, G> = G extends BaseG<infer R, infer A> ? Xt<Res, Err, R, A> : Xt<Res, Err, BaseReader, boolean>;
export type Xa<Res = void, E = never, R extends BaseReader = BaseReader> = Xt<Res, E, R, true>;
export type Xa$<Res = void, R extends BaseReader = BaseReader> = Xt<Res, never, R, true>;
export type Xa_<E = never, R extends BaseReader = BaseReader> = Xt<void, E, R, true>;
export type Xa_$<R extends BaseReader = BaseReader> = Xt<void, never, R, true>;
export type Reads<R, X> = OWReader<Merge<GetReader<X>, {
    reads: R;
}>, X>;
export type Throws<Err, X> = X extends Xt<infer Res, any, infer Rdr, infer A> ? Xt<Res, Err, Rdr, A> : never;
type MergeReaderObj<Rdr, Obj> = Merge<Rdr, {
    reads: Rdr extends {
        reads: any;
    } ? Merge<Rdr["reads"], Obj> : Obj;
}>;
export declare function readingWith<Obj, ResB, ErrB, RdrB extends BaseReader, AB extends boolean>(obj: Obj, m: () => Xt<ResB, ErrB, MergeReaderObj<RdrB, Obj>, AB>): Xt<ResB, ErrB, RdrB, AB>;
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
declare function exec_safe2<ResB, ErrB, RdrB extends BaseReader>(m: () => Xt<ResB, ErrB, RdrB, false>, d: Omit<RdrB, "logs" | "warns">): $.Result<ResB, ErrB>;
declare function exec_safe1<ResB, ErrB>(m: () => Xt<ResB, ErrB, MergeReaderObj<BaseReader, Record<string, never>>, false>): $.Result<ResB, ErrB>;
type Exec_Fn<ResB, ErrB, RdrB extends BaseReader> = typeof exec_safe1<ResB, ErrB> | typeof exec_safe2<ResB, ErrB, RdrB>;
export declare function exec<ResB, ErrB, RdrB extends BaseReader>(...args: Parameters<Exec_Fn<ResB, ErrB, RdrB>>): ReturnType<Exec_Fn<ResB, ErrB, RdrB>>;
export declare function execAsync<ResB, ErrB>(m: () => Xt<ResB, ErrB, BaseReader, true>): Promise<$.Result<ResB, ErrB>>;
export declare function Xawait<Pt, Et>(mkPromise: () => Promise<Pt>, catcher?: CatcherType<Et, Pt>): Xa<Pt, Et>;
export declare function maybe<Mt>(mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>): $.Maybe<Mt>;
export declare function pure<T>(t: T): X<T>;
type ReadType<Rdr> = Rdr extends {
    reads: any;
} ? Rdr["reads"] : never;
type Fn0<R> = () => R;
type ThisX<Err, Rdr extends BaseReader, A extends boolean> = {
    proxy: Proxy.Of<[Err, Rdr, A]>;
    ask: Xt<ReadType<Rdr>, never, Rdr, false>;
    resumable: Xt<(<SRes, SErr>(x: Fn0<Xt<SRes, SErr, Rdr, A>>) => Xt<SRes, SErr, BaseReader, A>), never, Rdr, false>;
    asks: <Res>(f: (r: ReadType<Rdr>) => Res) => Xt<Res, never, Rdr, false>;
    reading<Obj, Res>(o: Obj, m: (this: ThisX<Err, MergeReaderObj<Rdr, Obj>, A>) => Xt<Res, Err, MergeReaderObj<Rdr, Obj>, A>): Xt<Res, Err, Rdr, A>;
    trying<Res>(m: (this: ThisX<Err, Rdr, A>) => Xt<Res, Err, Rdr, A>, c: (e: unknown) => $.Result<Res, Err>): Xt<Res, Err, Rdr, A>;
    fn: <FnArgs extends any[], FnRes>(f: (this: ThisX<Err, Rdr, A>, ...args: FnArgs) => Xt<FnRes, Err, Rdr, A>) => (...args: FnArgs) => Xt<FnRes, Err, Rdr, A>;
};
export declare function X<Args extends any[], Res, Err, Rdr extends BaseReader, A extends boolean>(f: (this: ThisX<Err, Rdr, A>, ...args: Args) => Xt<Res, Err, Rdr, A>): (...args: Args) => Xt<Res, Err, Rdr, A>;
export declare function parseT<ZT extends T.ZodType>(z: ZT, u: unknown): X<T.infer<ZT>, T.ZodError>;
export {};
//# sourceMappingURL=rwsea.d.ts.map