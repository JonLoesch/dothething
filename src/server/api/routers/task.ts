import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { recurringTasks } from "~/server/db/schema";

export const taskRouter = createTRPCRouter({
  schedule: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.recurringTasks.findMany();
  }),
  add: publicProcedure
    .input(
      z.object({
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(recurringTasks)
        .values({
          title: input.title,
        })
        .returning({
          id: recurringTasks.id,
        });
      return result[0]?.id;
    }),
  remove: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(recurringTasks)
        .where(eq(recurringTasks.id, input.id));
    }),
});
