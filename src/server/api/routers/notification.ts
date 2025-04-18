import { and, eq, inArray, sql } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { z } from "zod";
import { validators } from "~/app/_util/validators";
import { pushConfig } from "~/model/pushConfig";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  notificationTargets,
  pushConfigs,
  subscriptions,
  taskGroups,
} from "~/server/db/schema";

export const notificationRouter = createTRPCRouter({
  // subscribe: protectedProcedure
  //   .input(
  //     // https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
  //     validators.requests.pushNotificationSubscription,
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.insert(pushConfigs).values({
  //       userId: ctx.session.user.id,
  //       endpoint: input.endpoint,
  //       keys: input.keys,
  //     });
  //   }),
  // unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
  //   await ctx.db
  //     .delete(pushConfigs)
  //     .where(eq(pushConfigs.userId, ctx.session.user.id));
  // }),
  // isSubscribed: protectedProcedure.query(async ({ ctx }) => {
  //   const result = await ctx.db.query.pushSubscriptions.findFirst({
  //     where: eq(pushConfigs.userId, ctx.session.user.id),
  //   });
  //   return result !== undefined ? true : false;
  // }),

  allTargets: protectedProcedure.query(async ({ ctx }) => {
    return (
      await ctx.db.query.notificationTargets.findMany({
        where: eq(notificationTargets.userId, ctx.session.user.id),
        with: {
          configs: true,
          subscriptions: true,
        },
      })
    ).map(({ configs, ...rest }) => ({
      ...rest,
      configs: configs.map(pushConfig.FromDb),
    }));
  }),
  createPushTarget: protectedProcedure
    .input(pushConfig.validator)
    .mutation(async ({ ctx, input }) => {
      const ua = await UAParser(
        Object.fromEntries(ctx.headers),
      ).withClientHints();
      return await ctx.db.transaction(async (tx) => {
        const targetId = (
          await tx
            .insert(notificationTargets)
            .values({
              userId: ctx.session.user.id,
              title: pushConfig.defaultTargetName(ua),
            })
            .returning({
              id: notificationTargets.id,
            })
        )[0]!.id;
        await tx.insert(pushConfigs).values({
          targetId,
          ua: ua,
          endpoint: input.endpoint,
          keys: input.keys,
        });
        return targetId;
      });
    }),
  removeTarget: protectedProcedure
    .input(z.object({ id: validators.targetId }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(notificationTargets)
        .where(
          and(
            eq(notificationTargets.userId, ctx.session.user.id),
            eq(notificationTargets.id, input.id),
          ),
        );
    }),
  subscribe: protectedProcedure
    .input(
      z.object({
        targetId: validators.targetId,
        groupId: validators.taskGroupId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await ctx.db
      //   .insert(subscriptions)
      //   .select(
      //     ctx.db
      //     .select({
      //         id: sql<number>`nextval('"dothething_subscriptions_subscriptionId_seq"'::regclass)`.as('id'),
      //         createdAt: sql`now()`.as('createdAt'),
      //         updatedAt: sql`now()`.as('updatedAt'),
      //         deletedAt: sql`null`.as('deletedAt'),
      //         targetId: notificationTargets.id,
      //         groupId: taskGroups.id,
      //       })
      //       .from(taskGroups)
      //       .innerJoin(notificationTargets, eq(notificationTargets.userId, taskGroups.userId))
      //       .where(
      //         and(
      //           eq(taskGroups.userId, ctx.session.user.id),
      //           eq(taskGroups.id, input.groupId),
      //           eq(notificationTargets.id, input.targetId),
      //         ),
      //       ),
      //   );
      const myTargets = ctx.db.$with("targets").as(
        ctx.db
          .select({ targetId: notificationTargets.id })
          .from(notificationTargets)
          .where(
            and(
              eq(notificationTargets.userId, ctx.session.user.id),
              eq(notificationTargets.id, input.targetId),
            ),
          ),
      );
      const myGroups = ctx.db.$with("groups").as(
        ctx.db
          .select({ groupId: taskGroups.id })
          .from(taskGroups)
          .where(
            and(
              eq(taskGroups.userId, ctx.session.user.id),
              eq(taskGroups.id, input.groupId),
            ),
          ),
      );

      await ctx.db
        .with(myTargets, myGroups)
        .insert(subscriptions)
        .values({
          groupId: sql`(select * from ${myGroups})`,
          targetId: sql`(select * from ${myTargets})`,
        });
    }),
  unsubscribe: protectedProcedure
    .input(
      z.object({
        targetId: validators.targetId,
        groupId: validators.taskGroupId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const myTargets = ctx.db.$with("targets").as(
        ctx.db
          .select({ targetId: notificationTargets.id })
          .from(notificationTargets)
          .where(
            and(
              eq(notificationTargets.userId, ctx.session.user.id),
              eq(notificationTargets.id, input.targetId),
            ),
          ),
      );
      const myGroups = ctx.db.$with("groups").as(
        ctx.db
          .select({ groupId: taskGroups.id })
          .from(taskGroups)
          .where(
            and(
              eq(taskGroups.userId, ctx.session.user.id),
              eq(taskGroups.id, input.groupId),
            ),
          ),
      );

      await ctx.db
        .with(myTargets, myGroups)
        .delete(subscriptions)
        .where(
          and(
            inArray(subscriptions.groupId, sql`(select * from ${myGroups})`),
            inArray(subscriptions.targetId, sql`(select * from ${myTargets})`),
          ),
        );
    }),
});
