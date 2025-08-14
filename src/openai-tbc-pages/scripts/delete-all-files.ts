import { client } from "../lib/utils.ts";

/**
 * Delete all files from OpenAI file storage
 * This script will permanently remove all files uploaded to your OpenAI account
 */
async function deleteAllFiles(): Promise<void> {
  try {
    console.log("🔍 Fetching all files from OpenAI storage...");

    // Get all files from OpenAI storage
    const response = await client.files.list();
    const files = response.data;

    if (files.length === 0) {
      console.log("✅ No files found in storage. Nothing to delete.");
      return;
    }

    console.log(`📁 Found ${files.length} files in storage:`);

    // Display file information
    for (const [index, file] of files.entries()) {
      console.log(
        `  ${
          index + 1
        }. ${file.filename} (ID: ${file.id}, Size: ${file.bytes} bytes)`,
      );
    }

    // Ask for confirmation
    console.log(
      "\n⚠️  WARNING: This will permanently delete ALL files from your OpenAI storage!",
    );
    console.log("   This action cannot be undone.");

    // In a real script, you might want to add a confirmation prompt
    // For now, we'll proceed with deletion
    console.log("\n🗑️  Proceeding with deletion...");

    let deletedCount = 0;
    let failedCount = 0;

    // Delete files in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      console.log(
        `\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${
          Math.ceil(files.length / batchSize)
        }...`,
      );

      // Process batch concurrently
      const deletePromises = batch.map(async (file) => {
        try {
          await client.files.delete(file.id);
          console.log(`  ✅ Deleted: ${file.filename}`);
          return { success: true, filename: file.filename };
        } catch (error) {
          const errorMsg = error instanceof Error
            ? error.message
            : String(error);
          console.log(`  ❌ Failed to delete ${file.filename}: ${errorMsg}`);
          return { success: false, filename: file.filename, error: errorMsg };
        }
      });

      const results = await Promise.all(deletePromises);

      // Count successes and failures
      for (const result of results) {
        if (result.success) {
          deletedCount++;
        } else {
          failedCount++;
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < files.length) {
        console.log("   ⏳ Waiting 1 second before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Final summary
    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 DELETION SUMMARY");
    console.log(`${"=".repeat(50)}`);
    console.log(`✅ Successfully deleted: ${deletedCount} files`);
    if (failedCount > 0) {
      console.log(`❌ Failed to delete: ${failedCount} files`);
    }
    console.log(`📁 Total files processed: ${files.length}`);
    console.log("=".repeat(50));

    if (failedCount === 0) {
      console.log("🎉 All files have been successfully deleted!");
    } else {
      console.log(
        "⚠️  Some files failed to delete. Check the logs above for details.",
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Fatal error: ${errorMsg}`);
    Deno.exit(1);
  }
}

/**
 * Alternative function to delete files by purpose (e.g., only "assistants" files)
 */
async function deleteFilesByPurpose(purpose: string): Promise<void> {
  try {
    console.log(
      `🔍 Fetching files with purpose "${purpose}" from OpenAI storage...`,
    );

    const response = await client.files.list({ purpose });
    const files = response.data;

    if (files.length === 0) {
      console.log(
        `✅ No files found with purpose "${purpose}". Nothing to delete.`,
      );
      return;
    }

    console.log(`📁 Found ${files.length} files with purpose "${purpose}":`);

    // Display file information
    for (const [index, file] of files.entries()) {
      console.log(
        `  ${
          index + 1
        }. ${file.filename} (ID: ${file.id}, Size: ${file.bytes} bytes)`,
      );
    }

    console.log(
      `\n🗑️  Deleting ${files.length} files with purpose "${purpose}"...`,
    );

    let deletedCount = 0;
    let failedCount = 0;

    // Delete files one by one
    for (const file of files) {
      try {
        await client.files.delete(file.id);
        console.log(`  ✅ Deleted: ${file.filename}`);
        deletedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ Failed to delete ${file.filename}: ${errorMsg}`);
        failedCount++;
      }
    }

    // Summary
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📊 DELETION SUMMARY (Purpose: ${purpose})`);
    console.log(`${"=".repeat(50)}`);
    console.log(`✅ Successfully deleted: ${deletedCount} files`);
    if (failedCount > 0) {
      console.log(`❌ Failed to delete: ${failedCount} files`);
    }
    console.log(`📁 Total files processed: ${files.length}`);
    console.log("=".repeat(50));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Fatal error: ${errorMsg}`);
    Deno.exit(1);
  }
}

async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    // Default behavior: delete all files
    await deleteAllFiles();
  } else if (args[0] === "--purpose" && args[1]) {
    // Delete files by specific purpose
    await deleteFilesByPurpose(args[1]);
  } else if (args[0] === "--help" || args[0] === "-h") {
    console.log(`
🗑️  OpenAI File Storage Cleanup Script

Usage:
  deno run -A src/openai-tbc-pages/scripts/delete-all-files.ts [options]

Options:
  (no args)           Delete ALL files from OpenAI storage
  --purpose <purpose> Delete files with specific purpose (e.g., "assistants")
  --help, -h          Show this help message

Examples:
  # Delete all files (default)
  deno run -A src/openai-tbc-pages/scripts/delete-all-files.ts
  
  # Delete only files with "assistants" purpose
  deno run -A src/openai-tbc-pages/scripts/delete-all-files.ts --purpose assistants
  
  # Show help
  deno run -A src/openai-tbc-pages/scripts/delete-all-files.ts --help

⚠️  WARNING: This script will permanently delete files from your OpenAI storage!
   Make sure you have a backup if needed.
    `);
  } else {
    console.error("❌ Invalid arguments. Use --help for usage information.");
    Deno.exit(1);
  }
}

if (import.meta.main) main();
