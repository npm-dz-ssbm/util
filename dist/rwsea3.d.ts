import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";
declare class AsyncTag {
}
export type Async = AsyncTag;
type Catcher<Err, Res> = (e: any) => undefined | $.Result<Res, Err>;
type CmdT<K extends "Pass" | "Fail" | "Get" | "Await", D> = D & {
    cmd: K;
};
type AssumedI = {
    logs: (l: any) => void;
    warns: (w: any) => void;
    errors: (e: any) => void;
    reads: {};
};
type FullI<I> = {
    logs: [I] extends [never] ? AssumedI["logs"] : I extends {
        logs: (l: any) => void;
    } ? I["logs"] : AssumedI["logs"];
    warns: [I] extends [never] ? AssumedI["warns"] : I extends {
        warns: (l: any) => void;
    } ? I["warns"] : AssumedI["warns"];
    errors: [I] extends [never] ? AssumedI["errors"] : I extends {
        errors: (l: any) => void;
    } ? I["errors"] : AssumedI["errors"];
    reads: [I] extends [never] ? AssumedI["reads"] : I extends {
        reads: any;
    } ? I["reads"] : AssumedI["reads"];
};
type BaseXYields<E, I, A> = CmdT<"Pass", {}> | CmdT<"Get", {
    Proxy: Proxy.Of<FullI<I>>;
}> | CmdT<"Fail", {
    err: E;
}> | (A extends AsyncTag ? CmdT<"Await", {
    promise: Promise<unknown>;
    catcher?: Catcher<E, unknown>;
}> : never);
export type X<R = void, E = never, I = never, A = never> = Generator<BaseXYields<E, I, A>, R, {
    i: FullI<I>;
    a: any;
}>;
export type X_<E = never, I = never, A = never> = X<never, E, I, A>;
export type X$<R = void, I = never, A = never> = X<R, never, I, A>;
export type X_$<I = never, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = never> = X<R, E, I, AsyncTag>;
export type Xa_<E = never, I = never> = X<never, E, I, AsyncTag>;
export type Xa$<R = void, I = never> = X<R, never, I, AsyncTag>;
export type Xa_$<I = never> = X<void, never, I, AsyncTag>;
export declare function xPure<T>(t: T): X<T>;
export declare function xFail<R, E>(err: E): X<R, E>;
export declare function xOk<R, E>(r: $.Result<R, E>): X<R, E>;
export declare function xAsks<T, I>(f: (r: FullI<I>["reads"]) => T): X$<T, I>;
export declare function xAsk<I>(): X$<FullI<I>["reads"], I>;
export declare function xRead<I, K extends keyof FullI<I>["reads"]>(k: K): X$<FullI<I>["reads"][K], I>;
export declare function xLog<I>(l: $.Param0<FullI<I>["logs"]>): X_$<I>;
export declare function xWarns<I>(w: $.Param0<FullI<I>["warns"]>): X_$<I>;
export declare function xErrors<I>(e: $.Param0<FullI<I>["errors"]>): X_$<I>;
type MergeRdr<Rdr, I> = $.Merge<I, {
    reads: I extends {
        reads: any;
    } ? $.Merge<I["reads"], Rdr> : Rdr;
}>;
export declare function xReads<Rdr, R, E, I, A>(reads: Rdr, m: () => X<R, E, MergeRdr<Rdr, I>, A>): X<R, E, I, A>;
export declare function xTry<R, E, I, A>(m: () => X<R, E, I, A>, c: (e: unknown) => $.Result<R, E>): X<R, E, I, A>;
export declare function xWait<Pt, Et>(mkPromise: () => Promise<Pt>, catcher?: Catcher<Et, Pt>): Xa<Pt, Et>;
export declare function xThen<R1, R2, E, I, A>(m1: X<R1, E, I, A>, m2: (r: R1) => X<R2, E, I, A>): X<R2, E, I, A>;
export declare function xParse<ZT extends T.ZodType>(z: ZT, u: unknown): X<T.infer<ZT>, T.ZodError>;
export declare function xIntercept<R, E, I, A, Eout>(x: X<R, E, I, A>, c: (e: E) => $.Result<R, Eout>): X<R, Eout, I, A>;
export declare function xResult<R, E, I, A>(x: X<R, E, I, A>): X<$.Result<R, E>, never, I, A>;
export declare function xInvert<R, E, I, A>(x: X<R, E, I, A>): X<E, R, I, A>;
export declare function xMap<Rout, Rin, E, I, A>(vals: Rin[], f: (r: Rin, i: number) => X<Rout, E, I, A>): X<Rout[], E, I, A>;
export declare function xMapErr<Eout, R, Ein, I, A>(x: X<R, Ein, I, A>, maps: (e: Ein) => Eout): X<R, Eout, I, A>;
export declare function xFirst<R, E, I, A>(m1: () => X<R, E, I, A>, ...ms: ((e: E) => X<R, E, I, A>)[]): X<R, E, I, A>;
declare function execRaw_2<R, E, I, A>(m: () => X<R, E, I, A>, _i: I): (onDone: (er: $.Result<R, E>) => void) => Promise<void>;
declare function execRaw_1<R, E, A>(m: () => X<R, E, Record<string, undefined>, A>): (onDone: (er: $.Result<R, E>) => void) => Promise<void>;
type Exec_Raw_Fn<R, E, I, A> = typeof execRaw_1<R, E, A> | typeof execRaw_2<R, E, I, A>;
export declare function execAsync<R, E, I>(...args: Parameters<Exec_Raw_Fn<R, E, I, AsyncTag>>): Promise<$.Result<R, E>>;
export declare function exec<R, E, I>(...args: Parameters<Exec_Raw_Fn<R, E, I, never>>): $.Result<R, E>;
export declare function xMaybe<Mt>(mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>): $.Maybe<Mt>;
export {};
//# sourceMappingURL=rwsea3.d.ts.map