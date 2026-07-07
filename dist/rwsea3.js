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
const getAnyErrorer = safeGetter("errors", (a) => {
    console.log("base::xError", a);
});
const getAnyReader = safeGetter("reads", {});
function* getYield() {
    return yield { cmd: "Pass" };
}
function* getInternal() {
    const yn = yield* getYield();
    return yn.i;
}
function* withInternalMapped(maps, m) {
    const currI = yield* getInternal();
    const nextI = maps(currI);
    let yieldNext = yield* getYield();
    const it = m();
    while (true) {
        const result = it.next({
            a: yieldNext.a,
            i: nextI,
        });
        if (result.done) {
            return result.value;
        }
        else {
            yieldNext = (yield result.value);
        }
    }
}
export function* xPure(t) {
    return t;
}
export function* xFail(err) {
    yield { cmd: "Fail", err };
    return undefined;
}
export function xOk(r) {
    return $.result$(r)((s) => xPure(s), (e) => xFail(e));
}
export function* xAsks(f) {
    const i = yield* getInternal();
    return f(i.reads);
}
export function* xAsk() {
    return yield* xAsks((r) => r);
}
export function* xLog(l) {
    const i = yield* getInternal();
    i.logs(l);
}
export function* xWarns(w) {
    const i = yield* getInternal();
    i.warns(w);
}
export function* xErrors(e) {
    const i = yield* getInternal();
    i.errors(e);
}
export function xReads(reads, m) {
    return withInternalMapped((i0) => Object.assign({}, i0, { reads: getAnyReader(i0) }, { reads }), m);
}
export function* xTry(m, c) {
    try {
        return yield* m();
    }
    catch (e) {
        return yield* xOk(c(e));
    }
}
export function* xWait(mkPromise, catcher = () => undefined) {
    const { a } = yield {
        cmd: "Await",
        promise: mkPromise(),
        catcher,
    };
    return a;
}
export function* xThen(m1, m2) {
    const r1 = yield* m1;
    return yield* m2(r1);
}
export function xParse(z, u) {
    const parsed = z.safeParse(u);
    return xOk(parsed.success ? $.Ok(parsed.data) : $.Err(parsed.error));
}
export function* xIntercept(x, c) {
    let yieldNext = yield { cmd: "Pass" };
    const it = x;
    while (true) {
        const result = it.next(yieldNext);
        if (result.done) {
            return result.value;
        }
        else {
            const v = result.value;
            if (v.cmd === "Fail") {
                const caught = c(v.err);
                if (caught.Variant === "Ok") {
                    return caught.Data;
                }
                else {
                    yieldNext = yield { cmd: "Fail", err: caught.Data };
                }
            }
            else if (v.cmd === "Await") {
                const promiseCatcher = v.catcher;
                const awaitYieldVal = {
                    cmd: "Await",
                    promise: v.promise,
                    catcher: !promiseCatcher ? undefined : (e) => {
                        const i = promiseCatcher(e);
                        if (!i) {
                            return undefined;
                        }
                        else if (i.Variant === "Ok") {
                            return $.Ok(i.Data);
                        }
                        else {
                            return c(i.Data);
                        }
                    },
                };
                yieldNext = yield awaitYieldVal;
            }
            else {
                yieldNext = yield v;
            }
        }
    }
}
export function xResult(x) {
    return xIntercept($.greedy(function* () {
        const res = yield* x;
        return $.Ok(res);
    }), (e) => $.Ok($.Err(e)));
}
export function* xInvert(x) {
    const regular = yield* xResult(x);
    return yield* xOk($.invertResult(regular));
}
export function* xMap(vals, f) {
    const res = [];
    let i = 0;
    for (const v of vals) {
        res.push(yield* f(v, i));
        i++;
    }
    return res;
}
export function xFirst(m1, ...ms) {
    return xInvert($.greedy(function* () {
        let e = yield* xInvert(m1());
        for (const m of ms) {
            e = yield* xInvert(m(e));
        }
        return e;
    }));
}
function execRaw_2(m, _i) {
    return async (onDone) => {
        let awaited;
        const i = Object.assign({}, {
            logs: (l) => console.log("base:xLog", l),
            warns: (l) => console.log("base:xLog", l),
            errors: (l) => console.log("base:xLog", l),
            reads: {},
        }, _i);
        const g = m();
        while (true) {
            const result = g.next({ i, a: awaited });
            if (result.done) {
                return onDone($.Ok(result.value));
            }
            else {
                const y = result.value;
                if (y.cmd === "Fail") {
                    return onDone($.Err(y.err));
                }
                else if (y.cmd === "Await") {
                    const { promise, catcher } = y;
                    try {
                        awaited = await promise;
                    }
                    catch (err) {
                        if (!catcher) {
                            throw err;
                        }
                        const caughtVal = catcher(err);
                        if (!caughtVal) {
                            throw err;
                        }
                        else if (caughtVal.Variant === "Err") {
                            return onDone($.Err(caughtVal.Data));
                        }
                        else {
                            awaited = caughtVal.Data;
                        }
                    }
                }
            }
        }
    };
}
function execRaw_1(m) {
    return execRaw_2(m, {});
}
function execRaw(...args) {
    return args.length === 1 ? execRaw_1(...args) : execRaw_2(...args);
}
export function execAsync(...args) {
    return new Promise((resolve) => execRaw(...args)(resolve));
}
export function exec(...args) {
    let res = undefined;
    execRaw(...args)((r) => res = r);
    if (!res) {
        throw "non-terminated rwse monad";
    }
    return res;
}
export function xMaybe(mk) {
    const res = exec(() => mk((i) => xOk($.some(i))));
    if (res.Variant === "Ok") {
        return $.Some(res.Data);
    }
    return $.None();
}
//# sourceMappingURL=rwsea3.js.map