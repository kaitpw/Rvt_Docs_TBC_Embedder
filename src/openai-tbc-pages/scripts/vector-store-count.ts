import { load } from "https://deno.land/std@0.220.1/dotenv/mod.ts";
import OpenAI from "openai";

const OPENAI_API_KEY = await load().then((env) => env.OPENAI_API_KEY);
const VECTOR_STORE_ID = "vs_689843e4f3bc819196388a69cb6ba466";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

async function getVectorStoreFileCount(): Promise<number> {
  let totalCount = 0;
  let hasMore = true;
  let after: string | undefined = undefined;
  const limit = 100; // Use maximum limit for efficiency

  console.log("🔍 Counting files in vector store...");

  while (hasMore) {
    try {
      const response = await client.vectorStores.files.list(VECTOR_STORE_ID, {
        limit,
        after,
        order: "asc", // Use ascending order for consistent pagination
      });

      totalCount += response.data.length;
      hasMore = response.has_more;
      after = response.data[response.data.length - 1]?.id;

      console.log(`📊 Processed ${totalCount} files so far...`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error fetching vector store files: ${errorMsg}`);
      break;
    }
  }

  return totalCount;
}

async function main() {
  try {
    console.log("🚀 Getting vector store file count...");
    console.log(`🔗 Vector Store ID: ${VECTOR_STORE_ID}`);

    const count = await getVectorStoreFileCount();

    console.log("=".repeat(50));
    console.log(`📈 Total files in vector store: ${count}`);
    console.log("=".repeat(50));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 Error: ${errorMsg}`);
    Deno.exit(1);
  }
}

if (import.meta.main) main();
