import { createTable, DefaultFields, ForeignKey } from "./util";
import { UserId, users } from "./authSchema";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const recurringTasks = createTable("recurringTask", (d) => ({
  ...DefaultFields(d),
  nextDueDate: d.date(),
  lastAccomplishedAt: d.date(),
  title: d.varchar({ length: 255 }).notNull(),
  schedule: d.jsonb().$type<z.infer<typeof scheduleValidator>>().notNull(),
  ...UserId(d),
  // userId: UserId(d),
}));

export const pushSubscriptions = createTable('pushSubscriptions', d => ({
  ...DefaultFields(d),
  ...UserId(d),
  endpoint: d.varchar().notNull(),
  keys: d.jsonb().$type<Record<string, string>>().notNull(),
}));

export const scheduleValidator = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("weekly"),
    numberOfWeeks: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("monthly"),
    numberOfMonths: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("yearly"),
    numberOfYears: z.number().int().gt(0),
  }),
  z.object({
    type: z.literal("daily"),
    numberOfDays: z.number().int().gt(0),
  }),
]);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(recurringTasks),
}));

export const taskLog = createTable("taskLog", (d) => ({
  ...DefaultFields(d),
  taskId: ForeignKey(d, () => recurringTasks.id),
  accomplishedAt: d.date(),
}));
