import test from "node:test";
import assert from "node:assert";
import * as $ from "../src/index.js";

const x3: () => $.Reads<{ a: number }, $.X$<number>> = $.X(function* () {
  const a = yield* this.asks((r) => r.a);
  yield* this.asks((r) => console.log("x3", { r, a }));
  return a;
});

function* x2(a: number): $.X<number> {
  // yield* x3();
  const b = 8;
  yield* $.xLog(["x2", { a }]);
  return a + b;
}

function* x1(): $.Reads<{ a: number }, $.X$<number>> {
  const a = yield* x3();
  return yield* x2(a);
}

const x0: () => $.X<number> = $.X(function* () {
  return yield* this.reading({ a: 5 }, x1);
});

function* x0a(): $.Xa<number> {
  const res = yield* x0();
  return yield* $.Xawait(() => Promise.resolve(res));
}

test(async function $_tests() {
  assert.deepStrictEqual($.exec(x0), $.Ok(13));
  // assertEquals(await $.execAsync(x0a), $.Ok(13));
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
  return yield* $.catching(
    function* (): $.X<number, number> {
      const a1 = yield* $.ok($.some($.Some(1), 123));
      const a2 = yield* $.ok($.some($.None<number>(), 1));
      const a3 = yield* $.ok($.some($.Some(3), 2));
      return a1 + a2 + a3;
    },
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
