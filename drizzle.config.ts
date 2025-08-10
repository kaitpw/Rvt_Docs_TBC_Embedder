import { defineConfig } from "drizzle-kit";

export const DB_NAME = "tbc";
// run `npx drizzle-kit push` to push the schema (which will create a db if it doesn't exist)
// `driver: "pglite"` is an undocumented but necessary option to prevent errors when running drizzle kit
export default defineConfig({
  out: "./drizzle",
  schema: "src/dbified-index-page/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: `./${DB_NAME}.db`,
  },
});
