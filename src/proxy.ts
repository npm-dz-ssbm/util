type Proxy<T> = {
  __typeRef: (t: T) => T;
};
export type Of<T> = Proxy<T>;
export type Unwrap<T extends Proxy<any>> = ReturnType<T["__typeRef"]>;
export function Of<T>(): Proxy<T> {
  return { __typeRef: (t) => t };
}
