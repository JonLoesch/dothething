import type * as DrizzleBuilder from "drizzle-orm/pg-core";
import { sql, type ColumnBaseConfig, type ColumnDataType } from "drizzle-orm";
import { pgTableCreator } from "drizzle-orm/pg-core";
import snakify from "snakify-ts";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export const createTable = pgTableCreator(
  (name: string) => `dothething_${snakify(name, true)}`,
);

function PrimaryKey(d: PGSchemaBuilder) {
  return {
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  };
}

export function ForeignKey(
  d: PGSchemaBuilder,
  foreignIdColumn: () => DrizzleBuilder.PgColumn<
    ColumnBaseConfig<ColumnDataType, string>,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {},
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}
  >,
) {
  return d.integer().notNull().references(foreignIdColumn);
}

export function TimestampFields(d: PGSchemaBuilder) {
  return {
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: d.timestamp(),
  };
}

export function DefaultFields(d: PGSchemaBuilder) {
  return {
    ...PrimaryKey(d),
    ...TimestampFields(d),
  };
}

export type PGSchemaBuilder = {
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
