import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/globals.css";

import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DoTheThing",
  description: "A simple reminder application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function Layout(props: PropsWithChildren) {
  const session = await auth();

  return (
    <html lang="en" className="bg-base-100 h-full">
      <body className="h-full">
        <TRPCReactProvider>
          <HydrateClient>
            <div>
              <div className="bg-primary pb-48 [&+*]:-mt-48">
                <div className="navbar relative">
                  <div className="navbar-start flex flex-row">
                    <Link href="/">DoTheThing</Link>
                  </div>
                  <div className="navbar-center flex flex-row">
                    <Link href="/my/list">My Stuff</Link>
                    <Link href="/my/notification-settings">
                      Notification Settings
                    </Link>
                  </div>
                  <div className="navbar-end flex flex-row">
                    {session?.user ? (
                      <div className="dropdown dropdown-end">
                        <div
                          tabIndex={0}
                          role="button"
                          className="btn m1 btn-circle size-12"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={session.user.image}
                            className="rounded-full"
                          />
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
                        >
                          <li>
                            <Link href="/api/auth/signout">
                              Sign out
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <>
                        <Link href="/api/auth/signin">Sign in</Link>
                      </>
                    )}
                  </div>
                  <div className="border-primary-content/50 absolute inset-x-16 bottom-0 h-0 border-b" />
                </div>
              </div>
              <div className="p-10">{props.children}</div>
            </div>
          </HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
