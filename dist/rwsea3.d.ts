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
export type X_<E = never, I = never, A = never> = X<void, E, I, A>;
export type X$<R = void, I = never, A = never> = X<R, never, I, A>;
export type X_$<I = never, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = never> = X<R, E, I, AsyncTag>;
export type Xa_<E = never, I = never> = X<void, E, I, AsyncTag>;
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
export declare function encapsulate<R, E, I, A, Args extends any[] = []>(m: (...args: Args) => X<R, E, I, A>): X$<(...args: Args) => X<R, E, Record<string, undefined>, A>, I>;
declare abstract class Base_MX<Args extends any[] = [], R = void, E = never, I = never, A = never> {
    fail: typeof xFail<R, E>;
    args: Args;
    proxies: {
        Args: Proxy.Of<Args>;
        R: Proxy.Of<R>;
        E: Proxy.Of<E>;
        I: Proxy.Of<I>;
        A: Proxy.Of<A>;
        MX: Proxy.Of<Base_MX<Args, R, E, I, A>>;
        X: Proxy.Of<X<R, E, I, A>>;
    };
    constructor(...args: Args);
    get ask(): X$<FullI<I>["reads"], I>;
    $<Args extends any[], R, E, I, A>(MXConstructor: new (...args: Args) => MX<Args, R, E, I, A>, ...args: Args): X<R, E, I, A>;
    abstract do(): X<R, E, I, A>;
}
export declare abstract class MX<Args extends any[] = [], R = void, E = never, I = never, A = never> extends Base_MX<Args, R, E, I, A> {
}
export declare abstract class MX_<Args extends any[] = [], E = never, I = never, A = never> extends Base_MX<Args, void, E, I, A> {
}
export declare abstract class MX$<Args extends any[] = [], R = void, I = never, A = never> extends Base_MX<Args, R, never, I, A> {
}
export declare abstract class MX_$<Args extends any[] = [], I = never, A = never> extends Base_MX<Args, void, never, I, A> {
}
export declare abstract class MXa<Args extends any[] = [], R = void, E = never, I = never> extends Base_MX<Args, R, E, I, AsyncTag> {
}
export declare abstract class MXa_<Args extends any[] = [], E = never, I = never> extends Base_MX<Args, void, E, I, AsyncTag> {
}
export declare abstract class MXa$<Args extends any[] = [], R = void, I = never> extends Base_MX<Args, R, never, I, AsyncTag> {
}
export declare abstract class MXa_$<Args extends any[] = [], I = never> extends Base_MX<Args, void, never, I, AsyncTag> {
}
export declare abstract class MX0<Args extends any[] = [], R = void, E = never, I = never, A = never> extends Base_MX<Args, R, E, I, A> {
}
export declare abstract class MX_0<E = never, I = never, A = never> extends Base_MX<[
], void, E, I, A> {
}
export declare abstract class MX$0<R = void, I = never, A = never> extends Base_MX<[
], R, never, I, A> {
}
export declare abstract class MX_$0<I = never, A = never> extends Base_MX<[
], void, never, I, A> {
}
export declare abstract class MXa0<R = void, E = never, I = never> extends Base_MX<[
], R, E, I, AsyncTag> {
}
export declare abstract class MXa_0<E = never, I = never> extends Base_MX<[
], void, E, I, AsyncTag> {
}
export declare abstract class MXa$0<R = void, I = never> extends Base_MX<[
], R, never, I, AsyncTag> {
}
export declare abstract class MXa_$0<I = never> extends Base_MX<[
], void, never, I, AsyncTag> {
}
export declare function mX<Args extends any[], R, E, I, A, MXI extends Base_MX<Args, R, E, I, A>>(MXConstructor: new (...args: Args) => MXI): (...args: Args) => X<R, E, I, A>;
export declare function xDo<Args extends any[], R, E, I, A>(MXConstructor: new (...args: Args) => MX<Args, R, E, I, A>, ...args: Args): X<R, E, I, A>;
export {};
//# sourceMappingURL=rwsea3.d.ts.map