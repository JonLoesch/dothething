import type { FC, PropsWithChildren, ReactNode } from "react";

export function ConditionalWrap(conditions: Array<[
    boolean, (props: PropsWithChildren) => ReactNode
]>, content: ReactNode): ReactNode {
    for (const cond of conditions) {
        if (cond[0]) {
            return cond[1].call(null, {children: content});
        }
    }
    return content;
}