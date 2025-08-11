// import { client } from "../lib/utils.ts";
// import { getFilesToProcess } from "../../common/fileProcessor.ts";

// export async function getTBCFilesFromStorage(): Promise<Map<string, string>> {
//   // Get all files from storage
//   const allFiles = await client.files.list({ purpose: "assistants" });

//   // Get the list of TBC files we should have
//   const tbcFiles = await getFilesToProcess();
//   const tbcFilenames = new Set(tbcFiles.map((f) => f.finalFile));

//   // Filter to only TBC files and create filename -> id mapping
//   const tbcFileMap = new Map<string, string>();
//   for (const file of allFiles.data) {
//     if (tbcFilenames.has(file.filename)) {
//       tbcFileMap.set(file.filename, file.id);
//     }
//   }

//   return tbcFileMap;
// }

// async function addFileToVectorStore(
//   fileId: string,
//   filename: string,
// ): Promise<boolean> {
//   try {
//     const vectorStoreId = Deno.env.get("OPENAI_VECTOR_STORE_ID");
//     if (!vectorStoreId) {
//       throw new Error("OPENAI_VECTOR_STORE_ID is not set");
//     }
//     await client.vectorStores.files.create(vectorStoreId, {
//       file_id: fileId,
//     });
//     console.log(`✅ Added to vector store: ${filename}`);
//     return true;
//   } catch (error) {
//     const errorMsg = error instanceof Error ? error.message : String(error);
//     console.error(`❌ Failed to add ${filename} to vector store: ${errorMsg}`);
//     return false;
//   }
// }

// async function addAllTBCFilesToVectorStore(): Promise<void> {
//   // Get only the TBC files that exist in storage
//   const tbcFileMap = await getTBCFilesFromStorage();

//   if (tbcFileMap.size === 0) {
//     console.log(
//       "⚠️  No TBC files found in storage. Run file-storage-upload.ts first.",
//     );
//     return;
//   }

//   console.log(`🔗 Adding ${tbcFileMap.size} TBC files to vector store...`);

//   const addPromises = Array.from(tbcFileMap.entries()).map(
//     async ([filename, fileId]) => {
//       return await addFileToVectorStore(fileId, filename);
//     },
//   );

//   const results = await Promise.all(addPromises);
//   const successfulAdds = results.filter(Boolean).length;
//   const failedAdds = results.length - successfulAdds;

//   if (failedAdds > 0) {
//     console.log(`⚠️  ${failedAdds} additions failed`);
//   }

//   console.log(
//     `✅ Successfully added ${successfulAdds} TBC files to vector store`,
//   );
// }

// async function main() {
//   try {
//     console.log("🚀 Adding TBC blog files to vector store...");
//     console.log(
//       `🔗 Vector Store ID: ${Deno.env.get("OPENAI_VECTOR_STORE_ID")}`,
//     );

//     const files = await getFilesToProcess();
//     console.log(`📁 Found ${files.length} TBC files to process`);

//     await addAllTBCFilesToVectorStore();

//     console.log("🎉 Vector store update complete!");
//   } catch (error) {
//     const errorMsg = error instanceof Error ? error.message : String(error);
//     console.error(`💥 Error: ${errorMsg}`);
//     Deno.exit(1);
//   }
// }

// if (import.meta.main) main();
