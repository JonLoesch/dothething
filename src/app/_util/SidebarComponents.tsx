"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

// import { createContext, useContext, useEffect, useState, type FC } from "react";
// import { createPortal } from "react-dom";

// type Item = string;

// class ContentStore {
//   private readonly store: Record<number, Item[]> = {};
//   private readonly listeners: Record<number, () => void> = {};
//   private index = 0;

//   private notify() {
//     for (const l of Object.values(this.listeners)) {
//       l();
//     }
//   }

//   register(items: Item[]) {
//     const id = this.index++;
//     this.store[id] = items;
//     this.notify();
//     return () => {
//       delete this.store[id];
//       this.notify();
//     };
//   }

//   items() {
//     return Object.values(this.store).reduce<Item[]>(
//       (acc, item) => [...acc, ...item],
//       [],
//     );
//   }

//   watch(l: () => void) {
//     const id = this.index++;
//     this.listeners[id] = l;
//     return () => {
//       delete this.listeners[id];
//     };
//   }
// }

// const ctx = createContext(new ContentStore());

// export function useAddSidebarItem(items: Item[]) {
//   const c = useContext(ctx);

//   useEffect(() => c.register(items), [c, items]);
// }

// function useSidebarItems() {
//   const c = useContext(ctx);

//   const [state, setState] = useState(() => c.items());

//   useEffect(() => c.watch(() => setState(c.items())), [c]);

//   return state;
// }

// export const SidebarItems: FC = () => {
//   const items = useSidebarItems();

//   if (items.length === 0) return null;

//   return (
//     <div className="w-24 flex flex-col">
//       {items.map((i, index) => (
//         <div key={index}>{i}</div>
//       ))}
//     </div>
//   );
// };


const ctx = createContext<() => Element | DocumentFragment | null>(() => null);

export const SidebarProvider = ctx.Provider;
export function useInjectSidebar() {
  const container = useContext(ctx)();

  return useCallback(
    (content: ReactNode) =>
      container ? createPortal(content, container) : null,
    [container],
  );
}
