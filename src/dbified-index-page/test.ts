import { drizzle } from "drizzle-orm/pglite";
import { tbc_pages } from "./schema.ts";
import { DB_NAME } from "../../drizzle.config.ts";

// Database connection
const db = drizzle(`./${DB_NAME}.db`);

const totalRows = await db.select({
  number: tbc_pages.number,
  date: tbc_pages.date,
  title: tbc_pages.title,
  urlExternal: tbc_pages.urlExternal,
  urlInternal: tbc_pages.urlInternal,
  categories: tbc_pages.categories,
  topic: tbc_pages.topic,
}).from(tbc_pages);
console.log("TOTAL ROWS: ", totalRows);
