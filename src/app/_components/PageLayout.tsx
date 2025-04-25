import { useQueryClient } from "@tanstack/react-query";
import type { TemplateString } from "next/dist/lib/metadata/types/metadata-types";
import type { Props } from "node_modules/@headlessui/react/dist/types";
import React, {
  Fragment,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { api } from "~/trpc/react";
import { ErrorDisplay } from "./ErrorDisplay";
import { cls } from "../_util/cls";
import { Icon } from "./icons";

export const PageLayout: FC<
  PropsWithChildren<{
    title?: string | TemplateString | null | ReactNode;
    sidebar?: ReactNode;
  }>
> = (props) => {
  return (
    <div>
      <ErrorDisplay />
      <div className="text-primary-content mb-4 text-lg font-bold lg:mb-10 lg:text-4xl">
        {displayTitle()}
      </div>
      <div className="bg-base-200 flex flex-col gap-4 rounded p-4 lg:flex-row">
        {/* {props.sidebar && <div className="flex w-xs flex-col">{props.sidebar}</div>}
        <div className="flex-1">{props.children}</div> */}
        {props.children}
      </div>
    </div>
  );

  function displayTitle(): ReactNode {
    if (props.title !== null && typeof props.title === "object") {
      if ("default" in props.title) {
        return props.title.default;
      }
      if ("absolute" in props.title) {
        return props.title.absolute;
      }
    }
    return props.title;
  }
};

export type PropsWithSectionHooks<T = Record<never, unknown>> = T & {
  close: () => void;
};

type ConditionallyRenderedLayout<T> = {
  Component: FC<PropsWithSectionHooks<T>>;
  close: () => void;
  params: T | null | false | undefined;
  title?: string;
};

// export function layoutSection<T>(
//   Component: FC<PropsWithSectionHooks<T>>,
//   rest: Omit<ConditionallyRenderedLayout<T>, "Component">,
// ) {
//   return { Component, ...rest };
// }
export function layoutSection<T>(x: ConditionallyRenderedLayout<T>) {
  return x;
}

export function SectionedLayout<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Levels extends ConditionallyRenderedLayout<any>[],
>(props: { levels: Levels }): ReactNode {
  const selectedLevels = props.levels
    .map((l, index) => (!l.params ? null : { l, index }))
    .filter((x) => x !== null);
  const deepestSelectedLevel = selectedLevels.findLast(() => true)?.index ?? -1;
  function closeAtAndAbove(n: number) {
    props.levels.forEach((l, index) => {
      if (index >= n && l.params) {
        l.close();
      }
    });
  }

  const title = (
    <>
      <div className="flex flex-row flex-nowrap items-center gap-3 overflow-clip text-nowrap lg:hidden max-sm:[&>*]:nth-last-[n+4]:hidden">
        {selectedLevels.map(({ l, index }) => {
          return (
            <Fragment key={index}>
              {index > 0 && <Icon.BreadcrumbSeparator className="h-4 min-w-4" />}
              <div
                className={`truncate ${index < deepestSelectedLevel ? "min-w-12" : "shrink-0"}`}
                onClick={() => closeAtAndAbove(index + 1)}
              >
                {l.title}
              </div>
            </Fragment>
          );
        })}
      </div>
      <div className="max-lg:hidden">
        {selectedLevels.find(() => true)?.l.title}
      </div>
    </>
  );

  return (
    <PageLayout title={title}>
      <>
        {selectedLevels.map(({ l: { Component, ...l }, index }) => {
          return (
            <div
              key={index}
              className={cls("lg:rounded lg:p-4", {
                if: index < deepestSelectedLevel,
                then: "max-lg:hidden",
                // else: "lg:bg-base-300 lg:grow-1",
              })}
            >
              <Component close={() => closeAtAndAbove(index)} {...l.params} />
            </div>
          );
        })}
      </>
    </PageLayout>
  );
}
