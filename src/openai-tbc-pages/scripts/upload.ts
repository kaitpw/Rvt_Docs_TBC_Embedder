import { client } from "../lib/utils.ts";
import { drizzle } from "drizzle-orm/pglite";
import { tbc_pages } from "../../dbified-index-page/schema.ts";
import { DB_NAME } from "../../../drizzle.config.ts";
import { PGlite } from "@electric-sql/pglite";

async function uploadToVectorStore(
  records: Array<{
    number: string;
    urlInternal: string;
    content: string;
    title: string;
    categories: string;
    topic: string | null;
  }>,
): Promise<void> {
  if (records.length === 0) return;

  console.log(
    `🔗 Adding ${records.length} files to storage and vector store...`,
  );

  try {
    const vectorStore = await client.vectorStores.create({
      name: `tbc_pages_${new Date().toISOString()}`,
    });

    console.log(`✅ Created vector store: ${vectorStore.id}`);

    // Check existing files once at the beginning
    const existingFiles = await client.files.list({ purpose: "assistants" });
    const existingFileMap = new Map(
      existingFiles.data.map((f) => [f.filename, f.id]),
    );

    let uploadedCount = 0;
    let skippedCount = 0;
    let vectorStoreAddedCount = 0;

    // Process files in batches for concurrent uploads
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Upload batch concurrently
      const uploadPromises = batch.map(async (record) => {
        const fileName = record.urlInternal.replace(/\.htm?$/i, ".html");
        const existingFileId = existingFileMap.get(fileName);

        if (existingFileId) {
          return { fileName, fileId: existingFileId, skipped: true };
        }

        const blob = new Blob([record.content], { type: "text/html" });
        const file = new File([blob], fileName, { type: "text/html" });
        const uploadResult = await client.files.create({
          file,
          purpose: "assistants",
        });
        return { fileName, fileId: uploadResult.id, skipped: false };
      });

      const batchResults = await Promise.all(uploadPromises);

      // Add batch to vector store concurrently
      const vectorStorePromises = batchResults.map((result) =>
        client.vectorStores.files.create(vectorStore.id, {
          file_id: result.fileId,
        })
      );
      await Promise.all(vectorStorePromises);

      // Update counts
      for (const result of batchResults) {
        if (result.skipped) {
          skippedCount++;
          console.log(`⏭️  File ${result.fileName} already exists, skipped`);
        } else {
          uploadedCount++;
          console.log(`✅ Uploaded ${result.fileName} (ID: ${result.fileId})`);
        }
        vectorStoreAddedCount++;
        console.log(`✅ Added ${result.fileName} to vector store`);
      }

      console.log(
        `📦 Processed batch ${Math.floor(i / batchSize) + 1}/${
          Math.ceil(records.length / batchSize)
        }`,
      );
    }

    console.log("\n🎉 Vector store processing complete!");
    console.log("📊 Summary:");
    console.log(`   - Files uploaded: ${uploadedCount}`);
    console.log(`   - Files added to vector store: ${vectorStoreAddedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Vector store ID: ${vectorStore.id}`);
  } catch (error) {
    console.error("💥 Error during vector store processing:", error);
    throw error;
  }
}

async function main() {
  try {
    // Get all database records to process
    const pgl = new PGlite(`./${DB_NAME}.db`);
    const db = drizzle(pgl);

    const allRecords = await db.select().from(tbc_pages);

    if (allRecords.length === 0) {
      console.log("ℹ️  No database records to process");
      return;
    }

    await uploadToVectorStore(allRecords);

    console.log("🎉 Processing complete!");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Error: ${errorMsg}`);
    Deno.exit(1);
  }
}

if (import.meta.main) main();
