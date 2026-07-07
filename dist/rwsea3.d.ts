import * as $ from "./core.js";
declare class AsyncTag {
}
type CatcherType<Err, Res> = (e: any) => undefined | $.Result<Res, Err>;
type BaseXYields<E, A> = {
    Type: "BaseXYields";
    Variant: "Pass";
    Data: null;
} | {
    Type: "BaseXYields";
    Variant: "Err";
    Data: E;
} | (A extends AsyncTag ? {
    Type: "BaseXYields";
    Variant: "Await";
    Data: [Promise<unknown>, CatcherType<E, unknown>];
} : never);
type GottenDefault<I, K extends string, D> = I extends Record<K, D> ? I[K] : D;
type GottenReads<I> = GottenDefault<I, "reads", {}>;
export type X<R = void, E = never, I = {}, A = never> = Generator<BaseXYields<E, A>, R, {
    i: I;
    a: any;
}>;
export type X_<E = never, I = {}, A = never> = X<never, E, I, A>;
export type X$<R = void, I = {}, A = never> = X<R, never, I, A>;
export type X_$<I = {}, A = never> = X<void, never, I, A>;
export type Xa<R = void, E = never, I = {}> = X<R, E, I, AsyncTag>;
export type Xa_<E = never, I = {}> = X<never, E, I, AsyncTag>;
export type Xa$<R = void, I = {}> = X<R, never, I, AsyncTag>;
export type Xa_$<I = {}> = X<void, never, I, AsyncTag>;
export declare function mapping<Rout, Rin, E, I, A>(vals: Rin[], f: (r: Rin, i: number) => X<Rout, E, I, A>): X<Rout[], E, I, A>;
export declare function ask<E, I, A>(): X<GottenReads<I>, E, I, A>;
export {};
//# sourceMappingURL=rwsea3.d.ts.map