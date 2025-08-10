import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DB_NAME } from "../../drizzle.config.ts";
import { PGlite } from "@electric-sql/pglite";

// Standalone database initialization utility
async function initializeDatabase() {
  const pgl = new PGlite(`./${DB_NAME}.db`);
  const db = drizzle(pgl);

  try {
    // Run migrations to create tables
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database initialized successfully!");
    console.log("✅ Tables created from schema");
  } catch (error) {
    console.log(
      "❌ Database initialization failed. Make sure you have migrations:",
    );
    console.log("   Run: deno task db:generate");
    console.log("   Then: deno task db:migrate");
    throw error;
  } finally {
    pgl.close();
  }
}

// Run initialization
initializeDatabase().catch(console.error);
