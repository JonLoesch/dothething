import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";
import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { type PropsWithChildren } from "react";
import type { Metadata } from "next";
import { titles } from "../_util/titles";
import { ProfilePic } from "../_widgets/ProfilePic";
import { Icon } from "../_fragments/Icon";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import { MainLayout } from "../_layout/MainLayout";

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
            <MainLayout session={session}>{props.children}</MainLayout>
          </HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
