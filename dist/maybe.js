import * as T from "./types.js";
export function isAny(v) {
    return v !== undefined && v !== null;
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
export function of(m) {
    return isAny(m) ? Some(m) : None();
}
export function it(m) {
    return m.Variant === "None" ? [] : [m.Data];
}
export function first(...ms) {
    for (const m of ms) {
        for (const el of it(m)) {
            return Some(el);
        }
    }
    return None();
}
export function nil(m) {
    return m.Variant === "None" ? undefined : m.Data;
}
export function or_(m, getFb) {
    return m.Variant === "None" ? getFb() : m.Data;
}
export function or(m, fb) {
    return or_(m, () => fb);
}
export function map(m, f) {
    return m.Variant === "None" ? None() : Some(f(m.Data));
}
//# sourceMappingURL=maybe.js.map