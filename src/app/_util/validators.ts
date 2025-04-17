import { z } from "zod";
import type { ColumnBaseConfig } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { recurringTasks, taskGroups } from "~/server/db/schema";

export const validators = {
  requests: {
    pushNotificationSubscription: z.object({
      endpoint: z.string().min(1),
      expirationTime: z.number().nullable(),
      keys: z.record(z.string(), z.string()),
    }),
  },
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
