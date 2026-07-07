import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";
class AsyncTag {
}
function safeGetter(k, d) {
    return (i) => {
        const castedI = i;
        const found = castedI && castedI[k];
        if (found) {
            return found;
        }
        return d;
    };
}
const getAnyLogger = safeGetter("logs", (a) => {
    console.log("base::xLog", a);
});
const getAnyWarner = safeGetter("warns", (a) => {
    console.log("base::xWarn", a);
});
const getAnyErrorer = safeGetter("error", (a) => {
    console.log("base::xError", a);
});
const getAnyReader = safeGetter("reads", {});
export function* mapping(vals, f) {
    const res = [];
    let i = 0;
    for (const v of vals) {
        res.push(yield* f(v, i));
        i++;
    }
    return res;
}
function* getYield() {
    return yield { Type: "BaseXYields", Variant: "Pass", Data: null };
}
function* getInternal() {
    const yn = yield* getYield();
    return yn.i;
}
function withInternal(nextI) {
    return function* (m) {
        let yieldNext = yield* getYield();
        const it = m();
        while (true) {
            const result = it.next({ a: yieldNext.a, i: nextI });
            if (result.done) {
                return result.value;
            }
            else {
                yieldNext = yield result.value;
            }
        }
    };
}
export function* ask() {
    const i = yield* getInternal();
    return getAnyReader(i);
}
function* f2() {
    const i = yield* getInternal();
    return i.b;
}
function* f1() {
    const i = yield* getInternal();
    const v2 = yield* withInternal({ b: i.a + 3, a: i.a })(f2);
    return i.a;
}
/*
X<I, E, I, A> {
  const yn = yield { Type: "BaseXYields", Variant: "Pass", Data: null };
  return yn.i;
}
*/
//# sourceMappingURL=rwsea3.js.map