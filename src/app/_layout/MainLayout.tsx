"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { TemplateString } from "next/dist/lib/metadata/types/metadata-types";
import React, {
  Fragment,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { ErrorDisplay } from "../_layout/ErrorDisplay";
import { cls } from "../_util/cls";
import { Icon } from "../_fragments/Icon";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import Link from "next/link";
import type { Session } from "next-auth";
import { titles } from "../_util/titles";
import { ProfilePic } from "../_widgets/ProfilePic";

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
            <Button slot="trigger" className="pr-2 pl-6 lg:hidden">
              <Icon.Hamburger className="size-8 in-expanded:hidden" />
              <Icon.XMark className="size-8 hidden in-expanded:block" />
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