import { createTable, DefaultFields, FK, FK_Constraint, jsonb } from "./util";
import { UserId, users } from "./authSchema";
import { relations } from "drizzle-orm";
import { schedule } from "~/model/schedule";

export const recurringTasks = createTable(
  "recurringTasks",
  (d) => ({
    ...DefaultFields(d, "recurringTaskId"),
    groupId: FK(d, () => taskGroups.id),
    nextDueDate: d.date().notNull(),
    lastAccomplishedAt: d.date().notNull(),
    title: d.varchar({ length: 255 }).notNull(),
    // schedule: d.jsonb().$type<z.infer<typeof scheduleValidator>>().notNull(),
    schedule: jsonb(d, schedule.validator),
  }),
  (table) => [FK_Constraint(table.groupId, taskGroups.id)],
);

export const taskGroups = createTable("taskGroups", (d) => ({
  ...DefaultFields(d, "taskGroupId"),
  ...UserId(d),
  title: d.varchar({ length: 255 }).notNull(),
  lastNotification: d.date().notNull(),
}));

export const groupRelations = relations(taskGroups, ({ many }) => ({
  tasks: many(recurringTasks),
}));
export const taskRelations = relations(recurringTasks, ({ one }) => ({
  group: one(taskGroups, {
    fields: [recurringTasks.groupId],
    references: [taskGroups.id],
  }),
}));

export const pushSubscriptions = createTable(
  "pushSubscriptions",
  (d) => ({
    ...DefaultFields(d, "pushSubscriptionId"),
    configId: FK(d, () => pushConfigs.id),
    groupId: FK(d, () => taskGroups.id),
  }),
  (table) => [
    FK_Constraint(table.configId, pushConfigs.id),
    FK_Constraint(table.groupId, taskGroups.id),
  ],
);

export const pushConfigs = createTable("pushConfigs", (d) => ({
  ...DefaultFields(d, "pushSubscriptionId"),
  ...UserId(d),
  endpoint: d.varchar().notNull(),
  keys: d.jsonb().$type<Record<string, string>>().notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(recurringTasks),
}));

// export const taskLog = createTable("taskLog", (d) => ({
//   ...DefaultFields(d, "taskLogId"),
//   taskId: ForeignKey(d, () => recurringTasks.id),
//   accomplishedAt: d.date(),
// }));
