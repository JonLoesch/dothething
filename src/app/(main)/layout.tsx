import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/globals.css";

import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  CloseButton,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { titles } from "../_util/titles";

export const metadata: Metadata = {
  title: "DoTheThang",
  description: "A simple reminder application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function Layout(props: PropsWithChildren) {
  const session = await auth();

  return (
    <html lang="en" className="bg-base-100 h-full">
      <head>
        {/* <meta name="viewport" content="viewport-fit=cover" /> */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="h-full">
        <TRPCReactProvider>
          <HydrateClient>
            <Disclosure>
              <div className="bg-primary pb-48 [&+*]:-mt-48">
                <div className="navbar relative">
                  <div className="navbar-start flex flex-row">
                    <Link href="/">DoTheThang</Link>
                  </div>
                  <div className="navbar-center flex flex-row max-lg:hidden">
                    {session?.user && (
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
                      {session?.user ? (
                        <div className="dropdown dropdown-end">
                          <div
                            tabIndex={0}
                            role="button"
                            className="btn m1 btn-circle size-12"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={session.user.image ?? undefined}
                              alt="Profile Image"
                              className="rounded-full"
                            />
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
                    <DisclosureButton className="group pr-2 pl-6 lg:hidden">
                      <Bars3Icon className="size-8 group-data-[open]:hidden" />
                      <XMarkIcon className="size-8 not-group-data-[open]:hidden" />
                    </DisclosureButton>
                  </div>
                  <div className="border-primary-content/50 absolute inset-x-16 -bottom-2 border-b" />
                </div>

                <DisclosurePanel className="text-xl lg:hidden">
                  <ul className="menu mt-6 w-full items-end gap-2 p-2">
                    {session?.user && (
                      <>
                        <li>
                          <CloseButton as={Link} href="/my/list">
                            {titles.list}
                          </CloseButton>
                        </li>
                        <li>
                          <CloseButton
                            as={Link}
                            href="/my/notification-settings"
                          >
                            {titles.notificationSettings}
                          </CloseButton>
                        </li>
                      </>
                    )}
                    <li>
                      {session?.user ? (
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
          </HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
