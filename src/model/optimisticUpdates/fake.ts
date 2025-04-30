function _brand<T extends string, TData = number>(x: TData) {
    return x as TData & {__brand: T};
}

let dec = -1;

export const fake = {
    userId: () => _brand<'userId', string>(`${dec--}`),
    taskId: () => _brand<'recurringTaskId'>(dec--),
    taskGroupId: () => _brand<'taskGroupId'>(dec--),
}