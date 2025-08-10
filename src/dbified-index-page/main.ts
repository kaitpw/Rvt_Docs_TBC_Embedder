import { drizzle } from "drizzle-orm/pglite";
import { tbc_index } from "./schema.ts";
import { DB_NAME } from "../../drizzle.config.ts";

// Database connection

const db = drizzle(`./${DB_NAME}.db`);

// CRUD operations
async function main() {
  try {
    // Insert a dummy row
    const dummyRow = await db.insert(tbc_index).values({
      number: 1,
      date: "2024-01-15",
      title: "Sample TBC Page",
      urlExternal: "https://example.com/sample",
      urlInternal: "/sample-page",
      categories: "development,revit",
      topic: "Getting Started",
      content:
        "This is a sample content for testing the database. It contains some dummy text to verify that the TBC index table is working correctly.",
    }).returning();

    console.log("✅ Inserted dummy row:", dummyRow);

    // Query all rows
    const result = await db.select().from(tbc_index);
    console.log("✅ All rows:", result);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the main function
main();
