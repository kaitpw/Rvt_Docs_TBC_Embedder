import { client } from "../lib/utils.ts";
import type { FileInfo } from "../../common/fileProcessor.ts";
import {
  getLocalFiles,
  getRemoteFilenames,
} from "../../common/fileProcessor.ts";

async function addToVectorStore(
  filesToProcess: Map<string, FileInfo>,
): Promise<void> {
  if (filesToProcess.size === 0) return;

  console.log(
    `🔗 Adding ${filesToProcess.size} files to storage and vector store...`,
  );

  try {
    const vectorStoreId = Deno.env.get("OPENAI_VECTOR_STORE_ID");
    if (!vectorStoreId) {
      throw new Error("OPENAI_VECTOR_STORE_ID is not set");
    }

    // Use batch operation for efficiency
    const batch = await client.vectorStores.fileBatches.uploadAndPoll(
      vectorStoreId,
      { file_ids: fileIds },
    );

    if (batch.status === "completed") {
      console.log(
        `✅ Successfully added ${fileIds.length} files to vector store`,
      );
    } else {
      console.log(`⚠️  Batch status: ${batch.status}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to add files to vector store: ${errorMsg}`);
  }
}

async function main() {
  try {
    console.log("🚀 Processing TBC blog files...");

    const localFiles = await getLocalFiles();
    console.log(`📁 Found ${localFiles.size} local files to process`);

    const remoteFiles = await getRemoteFilenames();
    console.log(`🔄 Found ${remoteFiles.size} existing files in storage`);

    const filesToProcess = new Map(
      Array.from(localFiles.entries()).filter(([prefix, localInfo]) => {
        const existingInfo = remoteFiles.get(prefix);
        const shouldSkip = existingInfo &&
          existingInfo.finalFile === localInfo.finalFile;
        return !shouldSkip;
      }),
    );

    console.log(`📤 Found ${filesToProcess.size} files to process and upload`);

    await addToVectorStore(filesToProcess);

    console.log("🎉 Processing complete!");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Error: ${errorMsg}`);
    Deno.exit(1);
  }
}

if (import.meta.main) main();
