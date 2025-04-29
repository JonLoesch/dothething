import type { FC, PropsWithChildren } from "react";
import { DialogTrigger, Button, Popover, type DisclosureProps } from "react-aria-components";

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
