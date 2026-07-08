import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";
declare class AsyncTag {
}
export type Async = AsyncTag;
type CatchFn<Res, Err> = (e: any) => undefined | $.Result<Res, Err>;
type CmdT<K extends "Pass" | "Fail" | "Await", D> = D & {
    cmd: K;
};
type BaseInternal = {
    logInfo: (a: any) => void;
    logWarning: (a: any) => void;
    logError: (a: any) => void;
    reads: {};
};
declare const BaseInternal: BaseInternal;
type TrueI<I> = {
    logInfo: [I] extends [never] ? BaseInternal["logInfo"] : I extends {
        l: {
            i: any;
        };
    } ? (a: I["l"]["i"]) => void : BaseInternal["logInfo"];
    logWarning: [I] extends [never] ? BaseInternal["logWarning"] : I extends {
        l: {
            w: any;
        };
    } ? (a: I["l"]["w"]) => void : BaseInternal["logWarning"];
    logError: [I] extends [never] ? BaseInternal["logError"] : I extends {
        l: {
            e: any;
        };
    } ? (a: I["l"]["e"]) => void : BaseInternal["logError"];
    reads: [I] extends [never] ? BaseInternal["reads"] : I extends {
        r: {};
    } ? I["r"] : BaseInternal["reads"];
};
type BaseXYields<E, A> = CmdT<"Pass", {}> | CmdT<"Fail", {
    err: E;
}> | (A extends AsyncTag ? CmdT<"Await", {
    p: Promise<unknown>;
    c?: CatchFn<unknown, E>;
}> : never);
type BaseX<R, E, TrueInternal, A> = Generator<BaseXYields<E, A>, R, {
    i: TrueInternal;
    a: any;
}>;
export type X<R = void, E = never, I = never, A = never> = BaseX<R, E, TrueI<I>, A>;
export type X_<E = never, I = never, A = never> = X<void, E, I, A>;
export type X$<R = void, I = never, A = never> = X<R, never, I, A>;
export type X_$<I = never, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = never> = X<R, E, I, Async>;
export type Xa_<E = never, I = never> = X<void, E, I, Async>;
export type Xa$<R = void, I = never> = X<R, never, I, Async>;
export type Xa_$<I = never> = X<void, never, I, Async>;
declare function execRaw_2<R, E, Iinit, A>(m: () => BaseX<R, E, $.Merge<BaseInternal, Iinit>, A>, iInit: Iinit): (onDone: (er: $.Result<R, E>) => void) => Promise<void>;
declare function execRaw_1<R, E, A>(m: $.Param0<typeof execRaw_2<R, E, {}, A>>): ReturnType<typeof execRaw_2<R, E, {}, A>>;
type Exec_Raw_Fn<R, E, I, A> = typeof execRaw_1<R, E, A> | typeof execRaw_2<R, E, I, A>;
export declare function execAsync<R, E, I>(...args: Parameters<Exec_Raw_Fn<R, E, I, AsyncTag>>): Promise<$.Result<R, E>>;
export declare function exec<R, E, I>(...args: Parameters<Exec_Raw_Fn<R, E, I, never>>): $.Result<R, E>;
export declare function xPure<T>(t: T): Generator<any, T>;
export declare function xFail<R, E>(err: E): X<R, E>;
export declare function xOk<R, E>(r: $.Result<R, E>): X<R, E>;
export declare function xTry<R, E, I, A>(m: () => X<R, E, I, A>, c: (e: unknown) => $.Result<R, E>): X<R, E, I, A>;
export declare function xAwait<Pt, Et>(mkPromise: () => Promise<Pt>, catcher?: CatchFn<Pt, Et>): Xa<Pt, Et>;
export declare function xThen<R1, R2, E, I, A>(m1: X<R1, E, I, A>, m2: (r: R1) => X<R2, E, I, A>): X<R2, E, I, A>;
export declare function xParse<ZT extends T.ZodType>(z: ZT, u: unknown): X<T.infer<ZT>, T.ZodError>;
export declare function xResult<R, E, I, A>(x: X<R, E, I, A>): X<$.Result<R, E>, never, I, A>;
export declare function xInvert<R, E, I, A>(x: X<R, E, I, A>): X<E, R, I, A>;
export declare function xMap<Rout, Rin, E, I, A>(vals: Rin[], f: (r: Rin, i: number) => X<Rout, E, I, A>): X<Rout[], E, I, A>;
export declare function xMapErr<Eout, R, Ein, I, A>(x: X<R, Ein, I, A>, maps: (e: Ein) => Eout): X<R, Eout, I, A>;
export declare function xFirst<R, E, I, A>(m1: () => X<R, E, I, A>, ...ms: ((e: E) => X<R, E, I, A>)[]): X<R, E, I, A>;
export declare function xCatch<R, E, I, A, Eout>(x: X<R, E, I, A>, c: (e: E) => $.Result<R, Eout>): X<R, Eout, I, A>;
export declare function genMaybe<Mt>(mk: (b: <It>(r: $.Maybe<It>) => X<It, undefined>) => X<Mt, undefined>): $.Maybe<Mt>;
type RawFnX<Args extends any[], R = void, E = never, I = never, A = never> = (...args: Args) => X<R, E, I, A>;
type MergeR<D, I> = $.Merge<I, {
    r: I extends {
        r: infer R;
    } ? [R] extends [never] ? D : $.Merge<I["r"], D> : D;
}>;
type XThis<I = never, A = never> = {
    proxies: {
        I: Proxy.Of<I>;
        A: Proxy.Of<A>;
    };
    fn<Args extends any[] = [], R = void, E = never>(f: (this: XThis<I, A>, ...args: Args) => X<R, E, I, A>): FnX<Args, R, E, I, A>;
    ask: X$<TrueI<I>["reads"], I>;
    asks<R>(f: (a: TrueI<I>["reads"]) => R): X$<R, I>;
    reading<D, R, E>(d: D, x: X<R, E, MergeR<D, I>, A>): X<R, E, I, A>;
    logInfo(a: $.Param0<TrueI<I>["logInfo"]>): X_$<I>;
    logWarning(a: $.Param0<TrueI<I>["logWarning"]>): X_$<I>;
    logError(a: $.Param0<TrueI<I>["logError"]>): X_$<I>;
    pure: typeof xPure;
    fail: typeof xFail;
    ok: typeof xOk;
    await: A extends AsyncTag ? typeof xAwait : never;
    first<R, E>(...args: Parameters<typeof xFirst<R, E, I, A>>): ReturnType<typeof xFirst<R, E, I, A>>;
    result<R, E>(...args: Parameters<typeof xResult<R, E, I, A>>): ReturnType<typeof xResult<R, E, I, A>>;
    invert<R, E>(...args: Parameters<typeof xInvert<R, E, I, A>>): ReturnType<typeof xInvert<R, E, I, A>>;
    map<Rout, Rin, E>(...args: Parameters<typeof xMap<Rout, Rin, E, I, A>>): ReturnType<typeof xMap<Rout, Rin, E, I, A>>;
    mapErr<Eout, R, Ein>(...args: Parameters<typeof xMapErr<Eout, R, Ein, I, A>>): ReturnType<typeof xMapErr<Eout, R, Ein, I, A>>;
    try<R, E>(...args: Parameters<typeof xTry<R, E, I, A>>): ReturnType<typeof xTry<R, E, I, A>>;
    then<R1, R2, E>(...args: Parameters<typeof xThen<R1, R2, E, I, A>>): ReturnType<typeof xThen<R1, R2, E, I, A>>;
    catch<R, E, Eout>(...args: Parameters<typeof xCatch<R, E, I, A, Eout>>): ReturnType<typeof xCatch<R, E, I, A, Eout>>;
};
export declare function FnX<Args extends any[], R, E, I, A>(f: (this: XThis<I, A>, ...args: Args) => X<R, E, I, A>): FnX<Args, R, E, I, A>;
export type FnX<Args extends any[], R = void, E = never, I = never, A = never> = RawFnX<Args, R, E, I, A>;
export type FnX_<Args extends any[] = [], E = never, I = never, A = never> = RawFnX<Args, void, E, I, A>;
export type FnX$<Args extends any[], R = void, I = never, A = never> = RawFnX<Args, R, never, I, A>;
export type FnX_$<Args extends any[], I = never, A = never> = RawFnX<Args, void, never, I, A>;
export type FnXa<Args extends any[], R = void, E = never, I = never> = RawFnX<Args, R, E, I, Async>;
export type FnXa_<Args extends any[] = [], E = never, I = never> = RawFnX<Args, void, E, I, Async>;
export type FnXa$<Args extends any[], R = void, I = never> = RawFnX<Args, R, never, I, Async>;
export type FnXa_$<Args extends any[], I = never> = RawFnX<Args, void, never, I, Async>;
export type Fn0X<R = void, E = never, I = never, A = never> = RawFnX<[
], R, E, I, A>;
export type Fn0X_<E = never, I = never, A = never> = RawFnX<[], void, E, I, A>;
export type Fn0X$<R = void, I = never, A = never> = RawFnX<[], R, never, I, A>;
export type Fn0X_$<I = never, A = never> = RawFnX<[], void, never, I, A>;
export type Fn0Xa<R = void, E = never, I = never> = RawFnX<[], R, E, I, Async>;
export type Fn0Xa_<E = never, I = never> = RawFnX<[], void, E, I, Async>;
export type Fn0Xa$<R = void, I = never> = RawFnX<[], R, never, I, Async>;
export type Fn0Xa_$<I = never> = RawFnX<[], void, never, I, Async>;
export {};
//# sourceMappingURL=rwsea4.d.ts.map