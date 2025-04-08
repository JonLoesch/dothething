import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import type * as DrizzleBuilder from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `dothething_${name}`);

function PK(d: PGSchemaBuilder) {
  return d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

export const recurringTasks = createTable("recurringTask", (d) => ({
  id: PK(d),
  title: d.varchar({ length: 255 }),
}));

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: PK(d),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

type PGSchemaBuilder = {
  bigint: typeof DrizzleBuilder.bigint;
  bigserial: typeof DrizzleBuilder.bigserial;
  boolean: typeof DrizzleBuilder.boolean;
  char: typeof DrizzleBuilder.char;
  cidr: typeof DrizzleBuilder.cidr;
  customType: typeof DrizzleBuilder.customType;
  date: typeof DrizzleBuilder.date;
  doublePrecision: typeof DrizzleBuilder.doublePrecision;
  inet: typeof DrizzleBuilder.inet;
  integer: typeof DrizzleBuilder.integer;
  interval: typeof DrizzleBuilder.interval;
  json: typeof DrizzleBuilder.json;
  jsonb: typeof DrizzleBuilder.jsonb;
  line: typeof DrizzleBuilder.line;
  macaddr: typeof DrizzleBuilder.macaddr;
  macaddr8: typeof DrizzleBuilder.macaddr8;
  numeric: typeof DrizzleBuilder.numeric;
  point: typeof DrizzleBuilder.point;
  geometry: typeof DrizzleBuilder.geometry;
  real: typeof DrizzleBuilder.real;
  serial: typeof DrizzleBuilder.serial;
  smallint: typeof DrizzleBuilder.smallint;
  smallserial: typeof DrizzleBuilder.smallserial;
  text: typeof DrizzleBuilder.text;
  time: typeof DrizzleBuilder.time;
  timestamp: typeof DrizzleBuilder.timestamp;
  uuid: typeof DrizzleBuilder.uuid;
  varchar: typeof DrizzleBuilder.varchar;
  bit: typeof DrizzleBuilder.bit;
  halfvec: typeof DrizzleBuilder.halfvec;
  sparsevec: typeof DrizzleBuilder.sparsevec;
  vector: typeof DrizzleBuilder.vector;
};
