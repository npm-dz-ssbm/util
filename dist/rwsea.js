import * as $ from "./core.js";
import * as Proxy from "./proxy.js";
export function readingWith(obj, m) {
    return _r(m, (rIn) => Object.assign({}, rIn, { reads: Object.assign({}, (rIn || {}).reads, obj) }));
}
export function* mapping(vals, f) {
    const res = [];
    let i = 0;
    for (const v of vals) {
        res.push(yield* f(v, i));
        i++;
    }
    return res;
}
export function* trying(m, c) {
    try {
        return yield* m();
    }
    catch (e) {
        return yield* ok(c(e));
    }
}
export function* catching(m, c) {
    let yieldNext = yield { cmd: "GET" };
    const it = m();
    while (true) {
        const result = it.next(yieldNext);
        if (result.done) {
            return result.value;
        }
        else {
            const v = result.value;
            if (v.cmd === "FAIL") {
                const caught = c(v.err);
                if (caught.Variant === "Ok") {
                    return caught.Data;
                }
                else {
                    yieldNext = yield { cmd: "FAIL", err: caught.Data };
                }
            }
            else if (v.cmd === "AWAIT") {
                const promiseCatcher = v.catcher;
                const awaitYieldVal = {
                    cmd: "AWAIT",
                    val: v.val,
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
function* _a() {
    const yieldNext = yield { cmd: "GET" };
    return yieldNext.reader;
}
function* _r(m, f) {
    let yieldNext = yield { cmd: "GET" };
    const reader = f(yieldNext.reader);
    const it = m();
    while (true) {
        const result = it.next({ ...yieldNext, reader });
        if (result.done) {
            return result.value;
        }
        else {
            const v = result.value;
            yieldNext = yield v;
        }
    }
}
export function resulting(m) {
    return catching(function* () {
        const res = yield* m();
        return $.Ok(res);
    }, (e) => $.Ok($.Err(e)));
}
export function* fail(err) {
    yield { cmd: "FAIL", err };
    return undefined;
}
export function* ok(r) {
    if (r.Variant === "Ok") {
        return r.Data;
    }
    return yield* fail(r.Data);
}
export function* inverting(m) {
    const regular = yield* resulting(m);
    return yield* ok($.invertResult(regular));
}
export function firstOk(m1, ...ms) {
    return inverting(function* () {
        let e = yield* inverting(m1);
        for (const m of ms) {
            e = yield* inverting(() => m(e));
        }
        return e;
    });
}
export function* xLog(l) {
    const r = yield* _a();
    r.logs(l);
}
export function* xWarn(w) {
    const r = yield* _a();
    r.warns(w);
}
export function* ask() {
    const r = yield* _a();
    return r.reads;
}
export function* asks(f) {
    const r = yield* _a();
    return f(r.reads);
}
async function execRaw(m, onDone) {
    let awaited;
    const g = m();
    const reader = Object.assign({}, {
        logs: (l) => console.log("base:log", l),
        warns: (w) => console.warn("base:warn", w),
    });
    while (true) {
        const result = g.next({ reader, awaited });
        if (result.done) {
            return onDone($.Ok(result.value));
        }
        else {
            const y = result.value;
            if (y.cmd === "FAIL") {
                return onDone($.Err(y.err));
            }
            else if (y.cmd === "AWAIT") {
                try {
                    awaited = await y.val;
                }
                catch (err) {
                    if (!y.catcher) {
                        throw err;
                    }
                    const caughtVal = y.catcher(err);
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
}
function exec_safe2(m, d) {
    let res = undefined;
    execRaw(() => readingWith(d.reads, m), (finalRes) => (res = finalRes));
    if (!res) {
        throw "non-terminated rwse monad";
    }
    return res;
}
function exec_safe1(m) {
    let res = undefined;
    execRaw(() => readingWith({}, m), (finalRes) => (res = finalRes));
    if (!res) {
        throw "non-terminated rwse monad";
    }
    return res;
}
export function exec(...args) {
    return args.length === 1 ? exec_safe1(...args) : exec_safe2(...args);
}
export function execAsync(m) {
    return new Promise((resolve) => execRaw(m, resolve));
}
export function* Xawait(mkPromise, catcher = () => undefined) {
    const { awaited } = yield {
        cmd: "AWAIT",
        val: mkPromise(),
        catcher,
    };
    return awaited;
}
export function maybe(mk) {
    const res = exec(() => mk((i) => ok($.some(i))));
    if (res.Variant === "Ok") {
        return $.Some(res.Data);
    }
    return $.None();
}
export function* pure(t) {
    yield { cmd: "GET" };
    return t;
}
export function X(f) {
    const xThis = {
        get resumable() {
            return (function* () {
                const { reader } = yield { cmd: "GET" };
                return function* (m) {
                    return yield* _r(m, () => reader);
                };
            })();
        },
        get ask() {
            return (function* () {
                const r = yield { cmd: "GET" };
                return r.reader.reads;
            })();
        },
        asks: function* (f) {
            const r = yield* xThis.ask;
            return f(r);
        },
        proxy: Proxy.Of(),
        reading: (o, m) => readingWith(o, X(m)),
        trying: (m, c) => trying(m, c),
        fn: (f) => X(f),
    };
    return f.bind(xThis);
}
//# sourceMappingURL=rwsea.js.map