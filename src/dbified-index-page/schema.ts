import { integer, pgSchema, text, varchar } from "drizzle-orm/pg-core";

const TABLE_NAME = "tbc_pages";

export const schema = pgSchema("tbc");

export const tbc_index = schema.table(TABLE_NAME, {
  number: varchar({ length: 4 }).primaryKey(),
  date: varchar({ length: 10 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  urlExternal: varchar({ length: 255 }).notNull(),
  urlInternal: varchar({ length: 255 }).notNull(),
  categories: varchar({ length: 255 }).notNull(),
  topic: varchar({ length: 255 }),
  content: text().notNull(),
});

// Export the schema for drizzle-kit
export default schema;
