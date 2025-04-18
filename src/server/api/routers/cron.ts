import { compareAsc } from "date-fns";
import { and, eq, inArray, sql } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { z } from "zod";
import { validators } from "~/app/_util/validators";
import { pushConfig } from "~/model/pushConfig";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  notificationTargets,
  pushConfigs,
  subscriptions,
  taskGroups,
} from "~/server/db/schema";
import webpush from "web-push";
import { env } from "~/env";

const cronProcedure = publicProcedure.use(({ ctx, next }) => {
  if (ctx.headers.get("CRON") !== "CRON") {
    // throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: null,
    },
  });
});

export const cronRouter = createTRPCRouter({
  runTestNotifications: cronProcedure.mutation(async ({ ctx }) => {
    webpush.setVapidDetails(
      "mailto:mail@example.com",
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    for (const target of await ctx.db.query.notificationTargets.findMany({
      with: {
        configs: true,
        subscriptions: {
          with: {
            group: {
              with: {
                tasks: true,
              },
            },
          },
        },
      },
    })) {
      for (const { endpoint, keys } of target.configs) {
        const groups = target.subscriptions.flatMap((x) => x.group);
        const tasks = groups.flatMap((x) => x.tasks);
        const failing = tasks.filter(
          (x) => compareAsc(x.nextDueDate, new Date()) <= 0,
        );
        const failingGroups = groups.filter((x) =>
          x.tasks.find((t) => failing.find((f) => f.id === t.id)),
        );
        if (failing.length > 0) {
          await webpush.sendNotification(
            { endpoint, keys: keys as { p256dh: string; auth: string } },
            JSON.stringify({
              title: "Test Push",
              body: `${failing.length} tasks overdue in group(s) ${failingGroups.map((g) => g.title).join(", ")}`,
              image: "/next.png",
              icon: "nextjs.png",
              url: "https://google.com",
            }),
          );
        }
      }
    }
  }),
});
