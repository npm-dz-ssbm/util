import * as $ from "./core.js";
import * as T from "./types.js";
import * as Proxy from "./proxy.js";
class AsyncTag {
}
const BaseInternal = {
    logInfo: (a) => console.log("{xLog}::info", a),
    logWarning: (a) => console.warn("{xLog}::warning", a),
    logError: (a) => console.error("{xLog}::error", a),
    reads: {},
    /*
    writes: {},
    states: {},
    emits: {},
    */
};
function execRaw_2(m, iInit) {
    return async (onDone) => {
        let awaited;
        const i = Object.assign({}, BaseInternal, iInit);
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
                    const { p, c } = y;
                    try {
                        awaited = await p;
                    }
                    catch (err) {
                        if (!c) {
                            throw err;
                        }
                        const caughtVal = c(err);
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
    execRaw(...args)((r) => (res = r));
    if (!res) {
        throw "non-terminated rwse monad";
    }
    return res;
}
export function xPure(t) {
    return (function* () {
        return t;
    })();
}
export function* xFail(err) {
    yield { cmd: "Fail", err };
    return undefined;
}
export function xOk(r) {
    return $.result$(r)((s) => xPure(s), (e) => xFail(e));
}
export function* xTry(m, c) {
    try {
        return yield* m();
    }
    catch (e) {
        return yield* xOk(c(e));
    }
}
export function* xAwait(mkPromise, catcher = () => undefined) {
    const { a } = yield {
        cmd: "Await",
        p: mkPromise(),
        c: catcher,
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
export function xResult(x) {
    return xCatch($.immediate(function* () {
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
export function xMapErr(x, maps) {
    return xCatch(x, (e) => $.Err(maps(e)));
}
export function xFirst(m1, ...ms) {
    return xInvert($.immediate(function* () {
        let e = yield* xInvert(m1());
        for (const m of ms) {
            e = yield* xInvert(m(e));
        }
        return e;
    }));
}
export function* xCatch(x, c) {
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
                const promiseCatcher = v.c;
                const awaitYieldVal = {
                    cmd: "Await",
                    p: v.p,
                    c: !promiseCatcher
                        ? undefined
                        : (e) => {
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
export function genMaybe(mk) {
    const res = exec(() => mk((i) => xOk($.some(i))));
    if (res.Variant === "Ok") {
        return $.Some(res.Data);
    }
    return $.None();
}
export function FnX(f) {
    const proxies = {
        I: Proxy.Of(),
        A: Proxy.Of(),
    };
    function* getYield() {
        return yield { cmd: "Pass" };
    }
    function* getI() {
        const yieldVal = yield* getYield();
        return yieldVal.i;
    }
    function* ask() {
        const i = yield* getI();
        return i.reads;
    }
    const xThis = {
        mapErr: xMapErr,
        first: xFirst,
        then: xThen,
        catch: xCatch,
        result: xResult,
        invert: xInvert,
        map: xMap,
        proxies,
        fn: FnX,
        get ask() {
            return ask();
        },
        *asks(f) {
            const a = yield* xThis.ask;
            return f(a);
        },
        *reading(d, x) {
            const currI = yield* getI();
            const newReads = Object.assign({}, currI.reads, d);
            const newI = Object.assign({}, currI, {
                reads: newReads,
            });
            let yieldNext = yield* getYield();
            const it = x;
            while (true) {
                const result = it.next({
                    a: yieldNext.a,
                    i: newI,
                });
                if (result.done) {
                    return result.value;
                }
                else {
                    yieldNext = (yield result.value);
                }
            }
        },
        *logInfo(a) {
            const i = yield* getI();
            i.logInfo(a);
        },
        *logWarning(a) {
            const i = yield* getI();
            i.logWarning(a);
        },
        *logError(a) {
            const i = yield* getI();
            i.logError(a);
        },
        await: xAwait,
        pure: xPure,
        ok: xOk,
        fail: xFail,
        try: xTry,
    };
    return (...args) => f.bind(xThis)(...args);
}
const t = FnX(function* () {
    return 2;
});
const t2 = FnX(function* (a) {
    const helper = this.fn(function* (b) {
        // const [b2] = this.args;
        return yield* this.pure(b * 2);
    });
    const mult = yield* helper(2);
    const r = yield* this.ask;
    return mult * a * r.a;
});
//# sourceMappingURL=rwsea4.js.map