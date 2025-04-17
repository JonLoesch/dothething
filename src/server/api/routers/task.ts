import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { validators } from "~/app/_util/validators";
import { schedule } from "~/model/schedule";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { recurringTasks, taskGroups } from "~/server/db/schema";

export const taskRouter = createTRPCRouter({
  allGroups: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.taskGroups.findMany({
      where: eq(taskGroups.userId, ctx.session.user.id),
      with: {
        tasks: true,
      },
    });
  }),

  add: protectedProcedure
    .input(
      z.object({
        groupId: validators.taskGroupId,
        title: z.string().trim().min(1),
        schedule: schedule.validator,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(recurringTasks)
        .values({
          groupId: input.groupId,
          title: input.title,
          schedule: input.schedule,
          lastAccomplishedAt: new Date().toDateString(),
          nextDueDate: schedule
            .nextInstance(input.schedule, new Date())
            .toDateString(),
        })
        .returning({
          id: recurringTasks.id,
        });
      return result[0]?.id;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: validators.taskId,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(recurringTasks).where(
        and(
          inArray(
            recurringTasks.groupId,
            ctx.db
              .select({
                data: taskGroups.id,
              })
              .from(taskGroups)
              .where(eq(taskGroups.userId, ctx.session.user.id)),
          ),
          eq(recurringTasks.id, input.id),
        ),
      );
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: validators.taskId,
        title: z.string(),
        schedule: schedule.validator,
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
            inArray(
              recurringTasks.groupId,
              ctx.db
                .select({
                  data: taskGroups.id,
                })
                .from(taskGroups)
                .where(eq(taskGroups.userId, ctx.session.user.id)),
            ),
            eq(recurringTasks.id, input.id),
          ),
        );
    }),
});
