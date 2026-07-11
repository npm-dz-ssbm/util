export type Args<F extends (...args: any[]) => any> = Parameters<F>;
export type Ret<F extends (...args: any[]) => any> = ReturnType<F>;
export type Arg0<F extends (...args: any[]) => any> = Args<F>[0];
export type Arg1<F extends (...args: any[]) => any> = Args<F>[1];
export type Arg2<F extends (...args: any[]) => any> = Args<F>[2];
export type Arg3<F extends (...args: any[]) => any> = Args<F>[3];
