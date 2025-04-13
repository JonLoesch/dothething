"use client";

import { Button, Tooltip } from "flowbite-react";
import { createContext, useContext, type PropsWithChildren } from "react";

type Placement = Parameters<typeof Tooltip>[0]["placement"];

const ctx = createContext<Placement>("top");

export function useDefaultTooltipPlacement() {
  return useContext(ctx);
}

export function DefaultTooltipPlacement(
  props: PropsWithChildren<{ value: Placement }>,
) {
  return <ctx.Provider value={props.value}>{props.children}</ctx.Provider>;
}
