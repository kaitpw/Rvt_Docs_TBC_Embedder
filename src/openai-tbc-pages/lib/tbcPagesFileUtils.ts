import "jsr:@std/dotenv/load";
import OpenAI from "openai";

export interface FileInfo {
  prefix: string;
  htmlFile?: string;
  mdFile?: string;
  finalFile: string;
}

export interface OpenAIFile {
  id: string;
  filename: string;
  purpose: string;
}

export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function getFilesToProcess(): Promise<FileInfo[]> {
  const files = Deno.readDirSync("tbc/a");
  const fileMap = new Map<string, FileInfo>();

  for (const entry of files) {
    if (!entry.isFile) continue;

    const match = entry.name.match(/^(\d{4})_(.+)$/);
    if (!match) continue;

    const [, prefix, rest] = match;
    const ext = rest.split(".").pop()?.toLowerCase();

    if (!fileMap.has(prefix)) {
      fileMap.set(prefix, { prefix, finalFile: "" });
    }

    const info = fileMap.get(prefix);
    if (!info) continue;

    if (ext === "html" || ext === "htm") {
      info.htmlFile = entry.name;
      // Always convert .htm to .html for OpenAI compatibility
      info.finalFile = entry.name.replace(/\.htm?$/i, ".html");
    } else if (ext === "md" && !info.htmlFile) {
      info.mdFile = entry.name;
      info.finalFile = entry.name.replace(".md", ".html");
    }
  }

  return Array.from(fileMap.values()).filter((f) => f.finalFile);
}

export async function getTBCFilesFromStorage(): Promise<Map<string, string>> {
  // Get all files from storage
  const allFiles = await client.files.list({ purpose: "assistants" });

  // Get the list of TBC files we should have
  const tbcFiles = await getFilesToProcess();
  const tbcFilenames = new Set(tbcFiles.map((f) => f.finalFile));

  // Filter to only TBC files and create filename -> id mapping
  const tbcFileMap = new Map<string, string>();
  for (const file of allFiles.data) {
    if (tbcFilenames.has(file.filename)) {
      tbcFileMap.set(file.filename, file.id);
    }
  }

  return tbcFileMap;
}
