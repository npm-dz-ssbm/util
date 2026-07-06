type Proxy<T> = {
    __typeRef: (t: T) => T;
};
export type Of<T> = Proxy<T>;
export type Unwrap<T extends Proxy<any>> = ReturnType<T["__typeRef"]>;
export declare function Of<T>(): Proxy<T>;
export {};
//# sourceMappingURL=proxy.d.ts.map