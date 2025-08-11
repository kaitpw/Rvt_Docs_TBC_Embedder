import { defineConfig } from "drizzle-kit";

export const DB_NAME = "tbc";
// `driver: "pglite"` is an undocumented but necessary option to prevent errors when running drizzle kit
export default defineConfig({
  out: "./drizzle",
  schema: "src/dbified-index-page/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: `file://${Deno.cwd()}/${DB_NAME}.db`,
  },
});
