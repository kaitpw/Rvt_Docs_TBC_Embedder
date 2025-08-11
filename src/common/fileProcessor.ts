import { client } from "../openai-tbc-pages/lib/utils.ts";

export interface FileInfo {
  prefix: string;
  htmlFile?: string;
  mdFile?: string;
  finalFile: string;
  content?: string;
}

/**
 * @param filename - The filename to process
 * @returns The prefix, rest, and extension of the filename, or null if the filename is not a valid TBC page filename
 */
function getFilenameParts(
  filename: string,
): { prefix: string; rest: string; ext: string } | null {
  const match = filename.match(/^(\d{4})_(.+)$/);
  if (!match) return null;
  const [, prefix, rest] = match;
  const ext = rest.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return { prefix, rest, ext };
}

/**
 * Get the uploaded files from the OpenAI file storage
 * @returns A map of prefix to FileInfo
 */
export async function getRemoteFilenames(): Promise<Map<string, FileInfo>> {
  const filesParts = (await client.files.list({ purpose: "assistants" })).data
    .map((f) => getFilenameParts(f.filename))
    .filter((p) => p !== null);

  const fileMap = new Map(
    filesParts.map((p) => [
      p.prefix,
      {
        prefix: p.prefix,
        finalFile: `${p.prefix}_${p.rest}.${p.ext}`,
      },
    ]),
  );
  // TODO: DELETE THIS LOG AFTER TESTING
  console.log("UPLOADED FILES LENGTH: ", fileMap.size);
  ///////////////////////////////////
  return fileMap;
}

/**
 * Get the files to process from the tbc/a directory
 * @returns A map of prefix to FileInfo
 */
export async function getLocalFiles(
  dir: string,
): Promise<Map<string, FileInfo>> {
  const files = Deno.readDirSync(dir);
  const fileMap = new Map<string, FileInfo>();

  for (const entry of files) {
    const parts = getFilenameParts(entry.name);
    const okExt = ["html", "htm", "md"].includes(parts?.ext ?? "");
    if (!entry.isFile || !parts || !okExt) continue;

    // Add files to fileMap, prefer htmls over mds and convert htms to htmls
    if (!fileMap.has(parts.prefix)) {
      fileMap.set(parts.prefix, { prefix: parts.prefix, finalFile: "" });
    }
    const info = fileMap.get(parts?.prefix ?? "");
    if (!info) continue;

    if (parts.ext === "html" || parts.ext === "htm") {
      info.htmlFile = entry.name;
      info.finalFile = entry.name.replace(/\.htm?$/i, ".html");
      info.content = await processFileContent(info, dir);
    } else if (parts.ext === "md" && !info.htmlFile) {
      info.mdFile = entry.name;
      info.finalFile = entry.name;
      info.content = await processFileContent(info, dir);
    }
  }
  console.log("LOCAL FILES LENGTH: ", fileMap.size);
  return fileMap;
}

async function processFileContent(
  info: FileInfo,
  dir: string,
): Promise<string> {
  const sourceFile = info.htmlFile || info.mdFile;
  if (!sourceFile) {
    console.log(`⚠️  No source file found for ${info.prefix}`);
  }

  const filePath = `${dir}/${sourceFile}`;
  const fileContent = await Deno.readTextFile(filePath);

  if (!fileContent.trim()) {
    console.log(`⏭️  Skipping empty file: ${sourceFile}`);
  }

  // Remove all "&nbsp;" characters from the file content
  const cleanedContent = fileContent.replace(/&nbsp;/g, " ");

  return cleanedContent;
}
