import * as T from "./T.js";
import * as $ from "./core.js";
import * as X from "./X.js";

type GenericF1<A, R> = (A extends undefined ? () => R : never) | ((a: A) => R);
type GenericSpecBase = { [K: string]: [T.ZodType, T.ZodType] };
type GenericSpecMethods<S extends GenericSpecBase, Err, I, A> = {
  [K in keyof S]: GenericF1<T.infer<S[K][0]>, X.X<T.infer<S[K][1]>, Err, I, A>>;
};
type ProvidedGenericSpecMethods<S extends GenericSpecBase, Err, I, A> =
  | GenericSpecMethods<S, Err, I, A>
  | (new () => GenericSpecMethods<S, Err, I, A>);
type LiftedGenericSpecVal<S extends GenericSpecBase> = {
  [K in keyof S]: T.infer<S[K][1]>;
};
type LiftedGenericSpecParamZod<S extends GenericSpecBase> = {
  [K in keyof S]: S[K][0];
};
type LiftedGenericSpecParam<S extends GenericSpecBase> = {
  [K in keyof S]: T.infer<S[K][0]>;
};
type GenericSpecVal<S extends GenericSpecBase> =
  LiftedGenericSpecVal<S>[keyof LiftedGenericSpecVal<S>];
type SpecDef<S extends GenericSpecBase> = {
  handler<Err, I, A>(
    mapZodErr: (ze: T.ZodError) => Err,
    methods: ProvidedGenericSpecMethods<S, Err, I, A>,
  ): (u: unknown) => X.X<GenericSpecVal<S>, Err, I, A>;
  sender<Err, I, A>(
    mapZodErr: (ze: T.ZodError) => Err,
    f: (o: object) => X.X<object, Err, I, A>,
  ): <K extends keyof S>(
    k: K,
    p: LiftedGenericSpecParam<S>[K],
  ) => X.X<LiftedGenericSpecVal<S>[K], Err, I, A>;
};
type ZippedObjects<O1, O2 extends { [K in keyof O1]: O2[K] }> = {
  [K in keyof O1]: [O1[K], O2[K]];
};
function ZipObjects<O1 extends object, O2 extends { [K in keyof O1]: O2[K] }>(
  o1: O1,
  o2: O2,
): ZippedObjects<O1, O2> {
  return $.mapValues(o1, (v, k) => [v, o2[k]]) as ZippedObjects<O1, O2>;
}
export function define<S extends GenericSpecBase>(spec: S): SpecDef<S> {
  const reqP1 = T.union(
    Object.keys(spec).map((literal: keyof S & string) =>
      T.tuple([T.literal(literal), T.unknown()]),
    ),
  );
  return {
    sender<Err, I, A>(
      mapZodErr: (ze: T.ZodError) => Err,
      f: (o: object) => X.X<object, Err, I, A>,
    ) {
      return function* <K extends keyof S>(
        k: K,
        p: LiftedGenericSpecParam<S>[K],
      ) {
        const valSpec = (spec[k] as S[K])[1];
        const val = yield* f([k, p]);
        const res = yield* X.xMapErr(X.xOk(T.parse(valSpec, val)), mapZodErr);
        return res as LiftedGenericSpecVal<S>[K];
      };
    },
    handler<Err, I, A>(
      mapZodErr: (ze: T.ZodError) => Err,
      provided: ProvidedGenericSpecMethods<S, Err, I, A>,
    ) {
      const methods =
        typeof provided === "function" ? new provided() : provided;
      return function* (rawParams) {
        const specAndMethods = ZipObjects(spec, methods);
        const [apiReqStr, apiParamUnparsed] = yield* X.xMapErr(
          X.xOk(T.parse(reqP1, rawParams)),
          mapZodErr,
        );

        function getParamSpecAndMethod<K extends keyof S>(
          k: K,
        ): [
          LiftedGenericSpecParamZod<S>[K],
          GenericSpecMethods<S, Err, I, A>[K],
        ] {
          const [[req], meth] = specAndMethods[k];
          return [req, meth];
        }
        const [paramSpec, handle] = getParamSpecAndMethod(apiReqStr);
        const apiParam = yield* X.xMapErr(
          X.xOk(T.parse(paramSpec, apiParamUnparsed)),
          mapZodErr,
        );
        return yield* handle(apiParam);
      };
    },
  };
}
