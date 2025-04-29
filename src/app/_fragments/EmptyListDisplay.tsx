import type { PropsWithChildren } from "react";
import { Icon } from "./Icon";

export function EmptyListDisplay(
    props: PropsWithChildren<{ items: unknown[] }>,
  ) {
    return (
      <div
        className="rounded-2 infobox m-4 flex flex-col items-center data-[show=false]:hidden"
        data-show={props.items.length === 0}
      >
        <Icon.EmptyMarker className="my-5 h-10 opacity-40" />
        {props.children}
      </div>
    );
  }
  