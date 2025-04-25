import type { FC, PropsWithChildren } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
  type DisclosureProps,
} from "react-aria-components";
import { Icon } from "./icons";

export const Explain: FC<
  PropsWithChildren<{ short: string }> & DisclosureProps
> = (props) => {
  return (
    <Disclosure {...props}>
      {(disclosure) => (
        <>
          <Heading>
            <Button
              slot="trigger"
              className="flex w-full flex-row items-center justify-between"
            >
              {props.short}
              <div className="link shrink-0 text-xs">
                {disclosure.isExpanded ? "less..." : "more..."}
              </div>
            </Button>
          </Heading>
          <DisclosurePanel className="infobox text-sm aria-hidden:hidden mt-4">
            {props.children}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export function EmptyListDisplay(
  props: PropsWithChildren<{ items: unknown[] }>,
) {
  return (
    <div
      className="rounded-2 m-4 flex flex-col infobox data-[show=false]:hidden items-center"
      data-show={props.items.length === 0}
    >
      <Icon.EmptyMarker className="my-5 h-10 opacity-40" />
      {props.children}
    </div>
  );
}