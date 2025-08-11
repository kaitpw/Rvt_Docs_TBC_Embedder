import { drizzle } from "drizzle-orm/pglite";
import { tbc_index } from "./schema.ts";
import { DB_NAME } from "../../drizzle.config.ts";
import { scrapeIndex } from "./lib/scrapeIndex.ts";
import { getLocalFiles } from "../common/fileProcessor.ts";

// Database connection
const db = drizzle(`./${DB_NAME}.db`);

async function populateDatabase() {
  try {
    const tocEntries = scrapeIndex("../../tbc/a/index.html");
    const filesToProcess = await getLocalFiles();
    console.log(
      `✅ Found ${tocEntries.length} TOC entries in tbc/a/index.html`,
    );
    console.log(`✅ Found ${filesToProcess.size} files to process`);

    // Step 4: Process each TOC entry and insert into database
    let processedCount = 0;
    let skippedCount = 0;

    for (const fileInfo of filesToProcess.values()) {
      try {
        const entry = tocEntries.find((e) => e.number === fileInfo.prefix);

        if (!fileInfo.content) {
          skippedCount++;
          console.log(
            `⚠️  Skipping FILE entry ${fileInfo.prefix} due to missing content`,
          );
          continue;
        }

        if (!entry) {
          skippedCount++;
          console.log(
            `⚠️  Skipping FILE entry ${fileInfo.prefix} due to missing INDEX entry`,
          );
          continue;
        }

        if (!entry.urlInternal || !entry.urlExternal || !entry.title) {
          skippedCount++;
          console.log(
            `⚠️  Skipping INDEX entry ${entry.number} due to missing required fields`,
            `\n     title: "${entry.title}", urlExternal: "${entry.urlExternal}", urlInternal: "${entry.urlInternal}"`,
          );
          continue;
        }

        // Insert into database
        await db.insert(tbc_index).values({
          number: entry.number,
          date: entry.date,
          title: entry.title,
          urlExternal: entry.urlExternal,
          urlInternal: entry.urlInternal,
          categories: entry.categories,
          topic: entry.topic,
          content: fileInfo.content,
        });

        processedCount++;
      } catch (error) {
        console.error(
          `❌ Error processing entry ${fileInfo.finalFile}: ${error}`,
        );
        skippedCount++;
      }
    }

    console.log("\n🎉 Database population complete!");
    console.log("📊 Summary:");
    console.log(`   - Total TOC entries: ${tocEntries.length}`);
    console.log(`   - Successfully processed: ${processedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);

    // Step 5: Verify the data by querying the database
    console.log("\n🔍 Verifying database contents...");
    try {
      const totalRows = await db.select().from(tbc_index);
      console.log(`✅ Database now contains ${totalRows.length} rows`);

      // Show a sample of the data
      if (totalRows.length > 0) {
        console.log("\n📋 Sample entries:");
        const sampleRows = totalRows.slice(0, 3);
        for (const row of sampleRows) {
          console.log(`   ${row.number}: ${row.title}`);
          console.log(`     Content length: ${row.content.length} characters`);
          console.log(`     Topic: ${row.topic || "None"}`);
          console.log("");
        }
      }
    } catch (queryError) {
      console.log(`⚠️  Could not query database: ${queryError}`);
      console.log(
        "   This might be due to database connection issues or schema problems.",
      );
    }
  } catch (error) {
    console.error("💥 Error during database population:", error);
    throw error;
  }
}

// Run the main function
if (import.meta.main) {
  populateDatabase();
}
