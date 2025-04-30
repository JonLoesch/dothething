import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { DecorateRouterRecord } from "@trpc/server/unstable-core-do-not-import";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { cronRouter } from "~/server/api/routers/cron";
import { createCallerFactory, createTRPCContext } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getQueryClient, trpc } from "~/trpc/server";

const factory = createCallerFactory(cronRouter);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cron: string }> },
) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const caller = factory({
    session: null,
    headers: req.headers,
    db,
  });

  const result = await (caller as Record<string, () => Promise<unknown>>)[
    (await params).cron
  ]!.call(caller);
  return Response.json({ result: result === undefined ? null : result });
}
