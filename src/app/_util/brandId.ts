export function _brand<T extends string, TData = number>(x: TData) {
    return x as TData & {__brand: T};
}