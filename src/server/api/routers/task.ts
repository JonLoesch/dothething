import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { recurringTasks, scheduleValidator } from "~/server/db/schema";

export const taskRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.recurringTasks.findMany({
      where: eq(recurringTasks.userId, ctx.session.user.id),
    });
    // const post = await ctx.db.query.findFirst({
    //   orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    // });

    // return post ?? null;
  }),
  // all: publicProcedure.query(async ({ ctx }) => {
  //   return ctx.db.query.recurringTasks.findMany();
  // }),
  add: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        schedule: scheduleValidator,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(recurringTasks)
        .values({
          title: input.title,
          userId: ctx.session.user.id,
          schedule: input.schedule,
        })
        .returning({
          id: recurringTasks.id,
        });
      return result[0]?.id;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(recurringTasks)
        .where(
          and(
            eq(recurringTasks.id, input.id),
            eq(recurringTasks.userId, ctx.session.user.id),
          ),
        );
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        schedule: scheduleValidator,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(recurringTasks)
        .set({
          schedule: input.schedule,
          title: input.title,
        })
        .where(
          and(
            eq(recurringTasks.id, input.id),
            eq(recurringTasks.userId, ctx.session.user.id),
          ),
        );
    }),
});
