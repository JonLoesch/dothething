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
  subscriptions: many(subscriptions),
}));
export const taskRelations = relations(recurringTasks, ({ one, many }) => ({
  group: one(taskGroups, {
    fields: [recurringTasks.groupId],
    references: [taskGroups.id],
  }),
}));

export const subscriptions = createTable(
  "subscriptions",
  (d) => ({
    ...DefaultFields(d, "subscriptionId"),
    targetId: FK(d, () => notificationTargets.id),
    groupId: FK(d, () => taskGroups.id),
  }),
  (table) => [
    FK_Constraint(table.targetId, notificationTargets.id),
    FK_Constraint(table.groupId, taskGroups.id),
  ],
);
export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  target: one(notificationTargets, {
    fields: [subscriptions.targetId],
    references: [notificationTargets.id],
  }),
  group: one(taskGroups, {
    fields: [subscriptions.groupId],
    references: [taskGroups.id],
  }),
}));

export const notificationTargets = createTable("notificationTargets", (d) => ({
  ...DefaultFields(d, "notificationTargetId"),
  ...UserId(d),
  title: d.varchar().notNull(),
}));

export const notificationTargetRelations = relations(
  notificationTargets,
  ({ many }) => ({
    configs: many(pushConfigs),
    subscriptions: many(subscriptions),
  }),
);

export const pushConfigs = createTable(
  "pushConfigs",
  (d) => ({
    ...DefaultFields(d, "pushConfigId"),
    targetId: FK(d, () => notificationTargets.id),
    ua: d.jsonb().$type<UAParser.IResult>().notNull(),
    endpoint: d.varchar().notNull().unique(),
    keys: d.jsonb().$type<Record<string, string>>().notNull(),
  }),
  (table) => [
    FK_Constraint(table.targetId, notificationTargets.id).onDelete("cascade"),
  ],
);
export const configRelations = relations(pushConfigs, ({ one }) => ({
  target: one(notificationTargets, {
    fields: [pushConfigs.targetId],
    references: [notificationTargets.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(recurringTasks),
}));

// export const taskLog = createTable("taskLog", (d) => ({
//   ...DefaultFields(d, "taskLogId"),
//   taskId: ForeignKey(d, () => recurringTasks.id),
//   accomplishedAt: d.date(),
// }));
