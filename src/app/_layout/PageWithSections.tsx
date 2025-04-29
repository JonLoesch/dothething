"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { TemplateString } from "next/dist/lib/metadata/types/metadata-types";
import React, {
  Fragment,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { api, TRPCReactProvider } from "~/trpc/react";
import { ErrorDisplay } from "./ErrorDisplay";
import { cls } from "../_util/cls";
import { Icon } from "../_fragments/Icon";
import { HydrateClient } from "~/trpc/server";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import Link from "next/link";
import type { Session } from "next-auth";
import { titles } from "../_util/titles";
import { ProfilePic } from "../_widgets/ProfilePic";
import { PageWithTitle } from "./PageWithTitle";


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

export function PageWithSections<
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
      <div className="flex flex-row flex-nowrap items-center gap-3 overflow-clip text-nowrap max-sm:[&>*]:nth-last-[n+4]:hidden">
        {selectedLevels.map(({ l, index }) => {
          return (
            <Fragment key={index}>
              {index > 0 && (
                <Icon.BreadcrumbSeparator className="h-4 min-w-4" />
              )}
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
    </>
  );

  return (
    <PageWithTitle title={title}>
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
    </PageWithTitle>
  );
}
