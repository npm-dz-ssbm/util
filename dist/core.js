import * as T from "./types.js";
export function immediate(f) {
    return f();
}
export function Maybe(m) {
    return T.defVariant("Maybe", {
        Some: m,
        None: T.null(),
    });
}
export function Some(m) {
    return { type: "Maybe", Variant: "Some", Data: m };
}
export function None() {
    return { type: "Maybe", Variant: "None", Data: null };
}
export function isSome(m) {
    return m.Variant === "Some";
}
export function isNone(m) {
    return m.Variant === "None";
}
export function Result(o, e) {
    return T.defVariant("Result", {
        Ok: o,
        Err: e,
    });
}
export function Ok(l) {
    return { type: "Result", Variant: "Ok", Data: l };
}
export function Err(r) {
    return { type: "Result", Variant: "Err", Data: r };
}
export function isOk(r) {
    return r.Variant === "Ok";
}
export function isErr(r) {
    return r.Variant === "Err";
}
export function maybe$(m) {
    return (onSome, onNone) => (isSome(m) ? onSome(m.Data) : onNone());
}
export function result$(r) {
    return (onOk, onErr) => (isOk(r) ? onOk(r.Data) : onErr(r.Data));
}
export const some = (...args) => {
    const [arg1, arg2 = undefined] = args;
    if (arg1.Variant === "Some") {
        return Ok(arg1.Data);
    }
    return Err(arg2);
};
export function invertResult(r) {
    return r.Variant === "Err" ? Ok(r.Data) : Err(r.Data);
}
export function maybeFromNullable(m) {
    return isAny(m) ? Some(m) : None();
}
export function arrayFromMaybe(m) {
    return m.Variant === "None" ? [] : [m.Data];
}
export function firstMaybe(...ms) {
    for (const m of ms) {
        for (const el of arrayFromMaybe(m)) {
            return Some(el);
        }
    }
    return None();
}
export function nullableFromMaybe(m) {
    return m.Variant === "None" ? null : m.Data;
}
export function orMaybe(m, fb) {
    return m.Variant === "None" ? fb : m.Data;
}
export function orMaybe_(m, getFb) {
    return m.Variant === "None" ? getFb() : m.Data;
}
export function mapMaybe(m, f) {
    return m.Variant === "None" ? None() : Some(f(m.Data));
}
export function quot(n, d) {
    return Math.floor(n / d);
}
export function withInd(a) {
    return a.map((e, i) => [e, i]);
}
export function chunk(a, n) {
    const res = [];
    let nextChunk = [];
    for (const [e, i] of withInd(a)) {
        nextChunk.push(e);
        if (quot(i, n) !== quot(i + 1, n)) {
            res.push(nextChunk);
            nextChunk = [];
        }
    }
    if (nextChunk.length > 0) {
        res.push(nextChunk);
    }
    return res;
}
export function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isAny(v) {
    return v !== undefined && v !== null;
}
export function isNil(v) {
    return v === undefined || v === null;
}
export function nilable(t) {
    return isAny(t) ? t : undefined;
}
export function snilable(t) {
    return t === "" ? undefined : nilable(t);
}
export function nullable(t) {
    return isAny(t) ? t : null;
}
export function snullable(t) {
    return t === "" ? null : nullable(t);
}
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash;
}
export function mapValues(obj, fn) {
    return Object.keys(obj).reduce((acc, key) => {
        const k = key;
        acc[k] = fn(obj[k], k, obj);
        return acc;
    }, {});
}
//# sourceMappingURL=core.js.map