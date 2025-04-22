import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter, createCaller } from "~/server/api/root";
import { cronRouter } from "~/server/api/routers/cron";
import { createCallerFactory, createTRPCContext } from "~/server/api/trpc";
import { db } from "~/server/db";

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
