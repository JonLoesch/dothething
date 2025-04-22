import type * as DrizzleBuilder from "drizzle-orm/pg-core";
import { sql, type ColumnBaseConfig, type ColumnDataType } from "drizzle-orm";
import { pgTableCreator, foreignKey } from "drizzle-orm/pg-core";
import snakify from "snakify-ts";
import type { z } from "zod";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export const createTable = pgTableCreator(
  (name: string) => `dothethang_${snakify(name, true)}`,
);

function PrimaryKey<T extends string>(d: PGSchemaBuilder, idName: T) {
  return {
    id: d
      .integer(idName)
      .$type<number & { __brand: T }>()
      .primaryKey()
      .generatedByDefaultAsIdentity(),
  };
}

export function FK<
  T extends DrizzleBuilder.PgColumn<
    ColumnBaseConfig<"number", string> & {
      data: number & { __brand: string };
    }
  >,
>(
  d: PGSchemaBuilder,
  _foreignIdColumn: () => T,
) {
  return d.integer().$type<T["_"]["data"]>().notNull();
}

export function FK_Constraint(
  column: DrizzleBuilder.ExtraConfigColumn<
    ColumnBaseConfig<ColumnDataType, string>
  >,
  foreignId: DrizzleBuilder.PgColumn<ColumnBaseConfig<ColumnDataType, string>>,
) {
  return foreignKey({
    columns: [column],
    foreignColumns: [foreignId],
    name: foreignId.name,
  });
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

export function DefaultFields<T extends string>(d: PGSchemaBuilder, idType: T) {
  return {
    ...PrimaryKey(d, idType),
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

export function jsonb<
  ZodSchema extends z.ZodTypeAny,
  TExtraFields extends Record<string, unknown> = Record<never, unknown>,
>(
  d: PGSchemaBuilder,
  validator: ZodSchema,
  fromDriver?: (data: z.infer<ZodSchema>) => z.infer<ZodSchema> & TExtraFields,
) {
  return d
    .customType<{
      data: z.infer<ZodSchema> & TExtraFields;
      driverData: z.infer<ZodSchema>;
    }>({
      dataType() {
        return "jsonb";
      },
      toDriver(value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
        return JSON.stringify(value) as any;
      },
      fromDriver,
      // fromDriver(value) {
      //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      //   return {
      //     ...value,
      //     ...getExtraFields(value),
      //   };
      // },
    })()
    .notNull();
}
