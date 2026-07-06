export * from "zod";
import * as Z from "zod";
import { mapValues } from "./core.js";
import * as Proxy from "./proxy.js";
export function defVariant(t, d) {
    const cons = mapValues(d, (d, Variant) => {
        if (d.safeParse(undefined).success && !d.safeParse(null).success) {
            return {
                Data: undefined,
                Variant,
                Type: t,
                ZodTypeProxy: Proxy.Of(),
            };
        }
        return (Data) => ({
            Data,
            Variant,
            Type: t,
            ZodTypeProxy: Proxy.Of(),
        });
    });
    const zodType = Z.discriminatedUnion("Variant", Object.values(mapValues(d, (Data, Variant) => Z.object({
        Data,
        Variant: Z.literal(Variant),
        Type: Z.literal(t),
    }))));
    return Object.assign({}, cons, { zodType });
}
//# sourceMappingURL=types.js.map