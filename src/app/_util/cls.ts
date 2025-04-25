import type { HTMLAttributes, HtmlHTMLAttributes } from "react";

type Classnames =
  | string
  | {
    if: boolean,
    then: Classnames,
    else?: Classnames,
  }
  | Classnames[];

export function cls(...classes: Classnames[]): HTMLAttributes<unknown>["className"] {
    const b: string[] = [];
    walk(classes, b);
    return b.join(' ');
}
function walk(classes: Classnames, buffer: string[])  {
    if (Array.isArray(classes)) {
        classes.forEach(c => walk(c, buffer));
    } else if(typeof classes === 'string'){
        buffer.push(classes);
    } else if (classes.if) {
        walk(classes.then, buffer);
    } else if (classes.else) {
        walk(classes.else, buffer);
    }
}