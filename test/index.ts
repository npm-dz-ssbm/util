import test from "node:test";
import assert from "node:assert";
import * as $ from "../src/index.js";

const z1: $.FnXOk<[number], number, { r: { a: number } }> = $.FnX(
  function* (n) {
    const { a } = yield* this.ask;
    const f = { a };
    yield* this.logInfo(["z1!", { a: f.a }]);
    return f.a * 2 + n;
  },
);

const z2: $.Fn0XOk<number, { r: { a: number } }> = $.FnX(function* () {
  const { a } = yield* this.ask;
  yield* this.logWarning(["x3!", { a }]);
  /*
  const ze = yield* $.encapsulate(z1);
  const zer = $.exec(() => ze(69));
  console.log({ zer });
  */
  return a * 2;
});

class X3 extends $.$0XOk<number, { r: { a: number } }> {
  *$() {
    const { a } = yield* this.ask;
    return a;
  }
}

const x2: $.FnX<[number], number> = $.FnX(function* (a) {
  // yield* x3();
  const b = 8;
  yield* this.logInfo(["x2", { a }]);
  return a + b;
});

const x1: $.Fn0XOk<number, { r: { a: number } }> = $.FnX(function* () {
  const a = yield* this.$$(X3)();
  const b = yield* this.use(X3).$();
  yield* this.logInfo([{ a, b }, a == b]);
  return yield* x2(a);
});

const x0: $.Fn0X<number> = $.FnX(function* () {
  return yield* this.reading({ a: 5 }, x1());
});

const x0a: $.Fn0Xa<number> = $.FnX(function* () {
  const res = yield* x0();
  return yield* this.await(() => Promise.resolve(res));
});

test(async function $_tests() {
  $.exec(z2, { reads: { a: 420 } });
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
  return yield* $.xCatch(
    $.immediate(function* (): $.X<number, number> {
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
