import test from "node:test";
import assert from "node:assert";
import * as $ from "../src/index.js";
import * as X3 from "../src/rwsea3.js";

function* z1(): X3.X$<number, { reads: { a: number; b: string } }> {
  // const f = yield* X3.xAsks(({ a }) => ({ a }));
  const f = { a: 27 };
  yield* X3.xLog(["x3!", { a: f.a }]);
  yield* X3.xErrors(["x3!", { a: f.a }]);
  yield* X3.xWarns(["x3!", { a: f.a }]);
  return f.a * 2;
}

function* z2(): X3.X$<number, { reads: { a: number } }> {
  // console.log(yield* z1());
  const f = yield* X3.xAsks((f) => f);
  yield* X3.xLog(["x3!", { a: f.a }]);
  yield* X3.xErrors(["x3!", { a: f.a }]);
  yield* X3.xWarns(["x3!", { a: f.a }]);
  return f.a * 2;
}

const x3: () => $.X$<number, { reads: { a: number } }> = function* () {
  const a = yield* $.xAsks((r) => r.a);
  yield* $.xAsks((r) => console.log("x3", { r, a }));
  return a;
};

function* x2(a: number): $.X<number> {
  // yield* x3();
  const b = 8;
  yield* $.xLog(["x2", { a }]);
  return a + b;
}

function* x1(): $.X$<number, { reads: { a: number } }> {
  const a = yield* x3();
  return yield* x2(a);
}

const x0: () => $.X<number> = function* () {
  return yield* $.xReads({ a: 5 }, x1);
};

function* x0a(): $.Xa<number> {
  const res = yield* x0();
  return yield* $.xWait(() => Promise.resolve(res));
}

test(async function $_tests() {
  assert.deepStrictEqual($.exec(x0), $.Ok(13));
  assert.deepStrictEqual(await $.execAsync(x0a), $.Ok(13));
  assert.deepStrictEqual($.quot(2, 3), 0);
  assert.deepStrictEqual($.quot(3, 3), 1);
  assert.deepStrictEqual($.quot(4, 3), 1);
  assert.deepStrictEqual($.withInd(["a", "b", "c"]), [
    ["a", 0],
    ["b", 1],
    ["c", 2],
  ]);
  assert.deepStrictEqual($.chunk([0, 1, 2, 3, 4, 5], 3), [
    [0, 1, 2],
    [3, 4, 5],
  ]);
  assert.deepStrictEqual($.chunk([0, 1, 2, 3, 4, 5, 6], 3), [
    [0, 1, 2],
    [3, 4, 5],
    [6],
  ]);
  assert.deepStrictEqual($.chunk([0, 1, 2, 3, 4, 5, 6, 7], 3), [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7],
  ]);
});

function* qt() {
  return yield* $.xIntercept(
    $.greedy(function* (): $.X<number, number> {
      const a1 = yield* $.xOk($.some($.Some(1), 123));
      const a2 = yield* $.xOk($.some($.None<number>(), 1));
      const a3 = yield* $.xOk($.some($.Some(3), 2));
      return a1 + a2 + a3;
    }),
    (e) => $.Ok(e),
  );
}

test(function Id_tests() {
  console.log($.exec(() => qt()));
  assert.deepStrictEqual($.Id.str(0), "NM");
  assert.deepStrictEqual($.Id.str(12), "N34O");
  assert.deepStrictEqual($.Id.str(12.2), "NNcyUO");
  assert.deepStrictEqual($.Id.str(""), "S");
  assert.deepStrictEqual($.Id.str("asdf"), "S1xsShC");
  assert.deepStrictEqual($.Id.str(null), "0");
  assert.deepStrictEqual($.Id.str(undefined), "_");
  assert.deepStrictEqual(
    $.Id.str(0, 12, 12.2, "", "asdf", null, undefined),
    "NM.N34O.NNcyUO.S.S1xsShC.0._",
  );
});
