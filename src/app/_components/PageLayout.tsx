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
import { Icon } from "./icons";
import { HydrateClient } from "~/trpc/server";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import Link from "next/link";
import type { Session } from "next-auth";
import { titles } from "../_util/titles";
import { ProfilePic } from "./ProfilePic";

export const MainLayout: FC<PropsWithChildren<{ session: Session | null }>> = (
  props,
) => {
  return (
    <Disclosure>
      <div className="bg-primary pb-48 [&+*]:-mt-48">
        <div className="navbar relative">
          <div className="navbar-start flex flex-row">
            <Link href="/">DoTheThang</Link>
          </div>
          <div className="navbar-center flex flex-row max-lg:hidden">
            {props.session?.user && (
              <>
                <Link href="/my/list">{titles.list}</Link>
                <Link href="/my/notification-settings">
                  {titles.notificationSettings}
                </Link>
              </>
            )}
          </div>
          <div className="navbar-end flex flex-row">
            <div className="max-lg:hidden">
              {props.session?.user ? (
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn m1 btn-circle size-12"
                  >
                    <ProfilePic src={props.session.user.image ?? undefined} />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-1 w-md p-2 shadow-sm"
                  >
                    <li>
                      <Link href="/api/auth/signout">Sign out</Link>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <Link href="/api/auth/signin">Sign in</Link>
                </>
              )}
            </div>
            <Button slot="trigger" className="group pr-2 pl-6 lg:hidden">
              <Icon.Hamburger className="size-8 group-data-[open]:hidden" />
              <Icon.XMark className="size-8 not-group-data-[open]:hidden" />
            </Button>
          </div>
          <div className="border-primary-content/50 absolute inset-x-16 -bottom-2 border-b" />
        </div>

        <DisclosurePanel className="text-xl lg:hidden">
          <ul className="menu mt-6 w-full items-end gap-2 p-2">
            {props.session?.user && (
              <>
                <li>
                  <Link href="/my/list">{titles.list}</Link>
                </li>
                <li>
                  <Link href="/my/notification-settings">
                    {titles.notificationSettings}
                  </Link>
                </li>
              </>
            )}
            <li>
              {props.session?.user ? (
                <Link href="/api/auth/signout">Sign out</Link>
              ) : (
                <Link href="/api/auth/signin">Sign in</Link>
              )}
            </li>
          </ul>
        </DisclosurePanel>
      </div>
      <div className="p-6 lg:p-10">{props.children}</div>
    </Disclosure>
  );
};

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
