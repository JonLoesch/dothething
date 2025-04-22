import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: ["./src/server/db/schema.ts", "./src/server/db/authSchema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["dothethang_*"],
  casing: "snake_case",
} satisfies Config;
