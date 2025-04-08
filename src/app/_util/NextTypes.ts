import type { ReactNode } from "react";

export type NextServerComponent = (props: Record<never, unknown>) => Promise<ReactNode>;