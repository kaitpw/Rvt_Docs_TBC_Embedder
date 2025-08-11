import { drizzle } from "drizzle-orm/pglite";
import { tbc_pages } from "./schema.ts";
import { DB_NAME } from "../../drizzle.config.ts";
import { PGlite } from "@electric-sql/pglite";

// Database connection
const pgl = new PGlite(`./${DB_NAME}.db`);
const db = drizzle(pgl);

async function deleteAllData() {
  try {
    console.log("🗑️  Deleting all existing data from tbc_pages table...");

    // Delete all rows
    await db.delete(tbc_pages);

    console.log("✅ All data deleted successfully!");

    // Verify the table is empty
    const remainingRows = await db.select().from(tbc_pages);
    console.log(`   - Remaining rows: ${remainingRows.length}`);
  } catch (error) {
    console.error("❌ Error deleting data:", error);
    throw error;
  } finally {
    // Close the database connection
    pgl.close();
  }
}

// Run the function
if (import.meta.main) {
  deleteAllData();
}
