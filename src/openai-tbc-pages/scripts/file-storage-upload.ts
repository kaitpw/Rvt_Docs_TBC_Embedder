import { client, getFilesToProcess } from "../lib/tbcPagesFileUtils.ts";

interface FileInfo {
  prefix: string;
  htmlFile?: string;
  mdFile?: string;
  finalFile: string;
}

async function getExistingFiles(): Promise<Set<string>> {
  const files = await client.files.list({ purpose: "assistants" });
  return new Set(files.data.map((f) => f.filename));
}

async function uploadFile(
  info: FileInfo,
  existingFiles: Set<string>,
): Promise<string | null> {
  if (existingFiles.has(info.finalFile)) return null;

  const sourceFile = info.htmlFile || info.mdFile;
  if (!sourceFile) {
    console.log(`⚠️  No source file found for ${info.prefix}`);
    return null;
  }

  const filePath = `tbc/a/${sourceFile}`;
  const fileContent = await Deno.readTextFile(filePath);

  if (!fileContent.trim()) {
    console.log(`⏭️  Skipping empty file: ${sourceFile}`);
    return null;
  }

  const isMarkdown = sourceFile.endsWith(".md");
  const mimeType = isMarkdown ? "text/markdown" : "text/html";
  const fileName = info.finalFile; // Always use the final filename (with .html extension)

  try {
    const blob = new Blob([fileContent], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    const uploaded = await client.files.create({
      file,
      purpose: "assistants",
    });

    console.log(`✅ Uploaded: ${sourceFile} -> ${uploaded.id}`);
    return uploaded.id;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to upload ${sourceFile}: ${errorMsg}`);
    return null;
  }
}

async function uploadFileBatch(
  fileInfos: FileInfo[],
  existingFiles: Set<string>,
): Promise<string[]> {
  const toUpload = fileInfos.filter((f) => !existingFiles.has(f.finalFile));

  if (toUpload.length === 0) {
    console.log("✨ All files are already uploaded");
    return [];
  }

  console.log(`📤 Uploading ${toUpload.length} new files...`);

  const uploadPromises = toUpload.map((info) =>
    uploadFile(info, existingFiles)
  );
  const results = await Promise.all(uploadPromises);

  const successfulUploads = results.filter((id): id is string => id !== null);
  const failedUploads = results.length - successfulUploads.length;

  if (failedUploads > 0) {
    console.log(`⚠️  ${failedUploads} uploads failed`);
  }

  return successfulUploads;
}

async function addToVectorStore(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;

  console.log(`🔗 Adding ${fileIds.length} files to vector store...`);

  try {
    const vectorStoreId = Deno.env.get("OPENAI_VECTOR_STORE_ID");
    if (!vectorStoreId) {
      throw new Error("OPENAI_VECTOR_STORE_ID is not set");
    }

    // Use batch operation for efficiency
    const batch = await client.vectorStores.fileBatches.createAndPoll(
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

    const files = await getFilesToProcess();
    console.log(`📁 Found ${files.length} files to process`);

    const existingFiles = await getExistingFiles();
    console.log(`🔄 Found ${existingFiles.size} existing files in storage`);

    const fileIds = await uploadFileBatch(files, existingFiles);
    await addToVectorStore(fileIds);

    console.log("🎉 Processing complete!");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Error: ${errorMsg}`);
    Deno.exit(1);
  }
}

if (import.meta.main) main();
