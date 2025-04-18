import "~/styles/globals.css";


import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/globals.css";

import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import type { PropsWithChildren } from "react";


export default async function Layout(props: PropsWithChildren) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const session = await auth();

  return (
    <html lang="en" className="bg-base-100 h-full">
      <body className="h-full">
        <TRPCReactProvider>
          <HydrateClient>
            <div>
              <div className="bg-primary pb-48 [&+*]:-mt-48">
                <div className="navbar relative">
                  <div className="[&_a]:btn [&_a]:btn-ghost navbar-start flex flex-row [&_a]:text-xl">
                    <Link href="/">DoTheThing</Link>
                  </div>
                  <div className="[&_a]:btn [&_a]:btn-ghost navbar-center flex flex-row [&_a]:text-xl">
                    <Link href="/my/list">My Stuff</Link>
                    <Link href="/my/profile">Profile</Link>
                  </div>
                  <div className="navbar-end flex flex-row"></div>
                  <div className="border-primary-content/50 absolute inset-x-12 bottom-0 h-0 border-b" />
                </div>
              </div>
              <div className="p-10">{props.children}</div>
            </div>
          </HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
};
