import { z } from "zod";
import type { ColumnBaseConfig } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { notificationTargets, recurringTasks, subscriptions, taskGroups } from "~/server/db/schema";

export const validators = {
  targetId: idFromColumn(() => notificationTargets.id),
  subscriptionId: idFromColumn(() => subscriptions.id),
  taskGroupId: idFromColumn(() => taskGroups.id),
  taskId: idFromColumn(() => recurringTasks.id),
};

export function idFromColumn<
  T extends PgColumn<
    ColumnBaseConfig<"number", string> & {
      data: number & { __brand: string };
    }
  >,
>(_foreignKeyColumn: () => T) {
  return z.number().int().min(1) as unknown as z.ZodType<
    number & { __brand: T["_"]["data"]["__brand"] },
    z.ZodNumber,
    number & { __brand: T["_"]["data"]["__brand"] }
  >;
}

export type TaskGroupId = z.infer<typeof validators.taskGroupId>;
export type TaskId = z.infer<typeof validators.taskId>;
