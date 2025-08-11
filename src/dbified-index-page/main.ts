import { drizzle } from "drizzle-orm/pglite";
import { tbc_pages } from "./schema.ts";
import { DB_NAME } from "../../drizzle.config.ts";
import { scrapeIndex } from "./lib/scrapeIndex.ts";
import { getLocalFiles } from "../common/fileProcessor.ts";
import { PGlite } from "@electric-sql/pglite";

// Database connection - use PGlite instance like in init.ts
const pgl = new PGlite(`./${DB_NAME}.db`);
const db = drizzle(pgl);

async function populateDatabase() {
  try {
    const tocEntries = await scrapeIndex("./tbc/a");
    const filesToProcess = await getLocalFiles("./tbc/a");
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

        // Validate data lengths before insertion
        const insertData = {
          number: entry.number,
          date: entry.date,
          title: entry.title,
          urlExternal: entry.urlExternal,
          urlInternal: entry.urlInternal,
          categories: entry.categories,
          topic: entry.topic || "",
          content: fileInfo.content,
        };

        // Check for data length violations
        if (insertData.number && insertData.number.length > 4) {
          console.error(
            `❌ Number too long: "${insertData.number}" (${insertData.number.length} chars, max 4)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.date && insertData.date.length > 10) {
          console.error(
            `❌ Date too long: "${insertData.date}" (${insertData.date.length} chars, max 10)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.title && insertData.title.length > 255) {
          console.error(
            `❌ Title too long: "${insertData.title}" (${insertData.title.length} chars, max 255)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.urlExternal && insertData.urlExternal.length > 255) {
          console.error(
            `❌ URL External too long: "${insertData.urlExternal}" (${insertData.urlExternal.length} chars, max 255)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.urlInternal && insertData.urlInternal.length > 255) {
          console.error(
            `❌ URL Internal too long: "${insertData.urlInternal}" (${insertData.urlInternal.length} chars, max 255)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.categories && insertData.categories.length > 255) {
          console.error(
            `❌ Categories too long: "${insertData.categories}" (${insertData.categories.length} chars, max 255)`,
          );
          skippedCount++;
          continue;
        }
        if (insertData.topic && insertData.topic.length > 255) {
          console.error(
            `❌ Topic too long: "${insertData.topic}" (${insertData.topic.length} chars, max 255)`,
          );
          skippedCount++;
          continue;
        }

        // Insert into database
        await db.insert(tbc_pages).values(insertData);

        processedCount++;
      } catch (error) {
        // Show the full error message for debugging
        console.error(
          `❌ Error processing entry ${fileInfo.finalFile}:`,
          error,
        );

        // Also log the data that was being inserted
        const entry = tocEntries.find((e) => e.number === fileInfo.prefix);
        if (entry) {
          console.error("   Data being inserted:", {
            number: entry.number,
            date: entry.date,
            title: entry.title?.substring(0, 50) +
              (entry.title?.length > 50 ? "..." : ""),
            urlExternal: entry.urlExternal?.substring(0, 50) +
              (entry.urlExternal?.length > 50 ? "..." : ""),
            urlInternal: entry.urlInternal?.substring(0, 50) +
              (entry.urlInternal?.length > 50 ? "..." : ""),
            categories: entry.categories?.substring(0, 50) +
              (entry.categories?.length > 50 ? "..." : ""),
            topic: entry.topic?.substring(0, 50) +
              (entry.topic?.length > 50 ? "..." : ""),
            contentLength: fileInfo.content?.length || 0,
          });
        }

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
      const totalRows = await db.select().from(tbc_pages);
      console.log(`✅ Database now contains ${totalRows.length} rows`);

      // Show a sample of the data
      if (totalRows.length > 0) {
        console.log("\n📋 Sample entries:");
        const sampleRows = totalRows.slice(0, 3);
        for (const row of sampleRows) {
          console.log(
            `   ${row.number}: ${row.title} (${row.content.length} chars)`,
          );
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
  } finally {
    // Close the database connection
    pgl.close();
  }
}

// Run the main function
if (import.meta.main) {
  populateDatabase();
}
