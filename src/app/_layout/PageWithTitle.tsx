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
import { ErrorDisplay } from "../_layout/ErrorDisplay";
import { cls } from "../_util/cls";
import { Icon } from "../_fragments/Icon";
import { HydrateClient } from "~/trpc/server";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import Link from "next/link";
import type { Session } from "next-auth";
import { titles } from "../_util/titles";
import { ProfilePic } from "../_widgets/ProfilePic";


export const PageWithTitle: FC<
  PropsWithChildren<{
    title?: string | TemplateString | null | ReactNode;
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