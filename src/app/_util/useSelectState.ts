import { useMemo, useState } from "react";

export function useSelectId<T extends {id: unknown}>(values: T[] | null | false | undefined) {
    const [id, setId] = useState<T['id']|null>(null);
    const selected = useMemo(() => values ? values.find(x => x.id === id) : undefined, [values, id]);
    return [selected, setId] as const;
}