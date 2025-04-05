import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";
import type * as DrizzleBuilder from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `dothething_${name}`);

function PK(d: SchemaBuilder) {
  return d.integer({ mode: "number" }).primaryKey({ autoIncrement: true });
}

export const recurringTasks = createTable(
  "recurringTask",
  d => ({
    id: PK(d),
    title: d.text({length: 256}),
  }),
)



export const posts = createTable(
  "post",
  (d) => ({
    id: PK(d),
    name: d.text({ length: 256 }),
    // createdById: d
    //   .text({ length: 255 })
    //   .notNull()
    //   .references(() => users.id),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    // index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

type SchemaBuilder = {
  blob: typeof DrizzleBuilder.blob;
  customType: typeof DrizzleBuilder.customType;
  integer: typeof DrizzleBuilder.integer;
  numeric: typeof DrizzleBuilder.numeric;
  real: typeof DrizzleBuilder.real;
  text: typeof DrizzleBuilder.text;
};
