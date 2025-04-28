import type { FC, PropsWithChildren } from "react";
import {
  Button,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  Heading,
  Popover,
  Tooltip,
  TooltipTrigger,
  type DisclosureProps,
} from "react-aria-components";
import { Icon } from "./icons";

export const Explain: FC<
  PropsWithChildren<{ short: string }> & DisclosureProps
> = (props) => {
  return (
    <div className="flex w-full flex-row items-center justify-between">
      {props.short}
      <DialogTrigger>
        <Button className="link shrink-0 text-xs">more...</Button>
        <Popover className="infobox mr-3 text-sm bg-info">{props.children}</Popover>
      </DialogTrigger>
    </div>
  );
};

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
