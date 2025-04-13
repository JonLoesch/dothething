import { eq } from "drizzle-orm";
import { z } from "zod";
import { validators } from "~/app/_util/validators";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { pushSubscriptions } from "~/server/db/schema";

export const subscriptionRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(
      // https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
      validators.requests.pushNotificationSubscription,
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(pushSubscriptions).values({
        userId: ctx.session.user.id,
        endpoint: input.endpoint,
        keys: input.keys,
      });
    }),
  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.session.user.id));
  }),
  isSubscribed: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.userId, ctx.session.user.id),
    });
    return result !== undefined ? true : false;
  }),
});
