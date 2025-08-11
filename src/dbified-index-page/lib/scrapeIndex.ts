import { parse } from "parse5";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface TOCEntry {
  number: string;
  date: string;
  title: string;
  urlExternal: string;
  urlInternal: string;
  categories: string;
  topic: string;
}

interface Parse5Node {
  nodeName: string;
  childNodes?: Parse5Node[];
  attrs?: Array<{ name: string; value: string }>;
  value?: string;
  nextSibling?: Parse5Node;
}

export function scrapeIndex(htmlFilePath: string): TOCEntry[] {
  const document = parse(readFileSync(htmlFilePath, "utf-8"));
  console.log("Parsing HTML document for TOC entries...");

  // Create a mapping of URLs to topics by scanning topic sections
  const urlToTopicsMap = createUrlToTopicsMap(document);
  console.log(
    `Found topic mappings for ${Object.keys(urlToTopicsMap).length} URLs`,
  );

  return extractTOCEntries(document, urlToTopicsMap);
}

function createUrlToTopicsMap(document: Parse5Node): Record<string, string[]> {
  const urlToTopics: Record<string, string[]> = {};

  // Find all topic headers (h4 elements starting with "5.")
  const topicHeaders = findElementsByTagName(document, "h4").filter((h) =>
    extractTextContent(h)?.startsWith("5.")
  );

  // For each topic header, find the associated ul elements and extract URLs
  for (const header of topicHeaders) {
    const topicName = extractTextContent(header)?.replace(/^5\.\d+\.\s*/, "") ||
      "";
    if (!topicName) continue;

    // Find ul elements that are children of the header's parent or siblings
    const parent = findParentElement(header, document);
    if (parent) {
      const childUls = findElementsByTagName(parent, "ul");

      for (const ul of childUls) {
        const links = findElementsByTagName(ul, "a");
        for (const link of links) {
          const href = link.attrs?.find((attr) => attr.name === "href")?.value;
          if (href?.startsWith("http://thebuildingcoder.typepad.com/")) {
            if (!urlToTopics[href]) {
              urlToTopics[href] = [];
            }
            if (!urlToTopics[href].includes(topicName)) {
              urlToTopics[href].push(topicName);
            }
          }
        }
      }
    }
  }

  return urlToTopics;
}

function findParentElement(
  element: Parse5Node,
  document: Parse5Node,
): Parse5Node | null {
  // Find the parent element by searching for elements that contain our target element
  const allElements = findAllElements(document);

  for (const candidate of allElements) {
    for (const child of candidate.childNodes ?? []) {
      if (child === element) {
        return candidate;
      }
    }
  }

  return null;
}

function findAllElements(element: Parse5Node): Parse5Node[] {
  const elements: Parse5Node[] = [element];

  for (const child of element.childNodes ?? []) {
    elements.push(...findAllElements(child));
  }

  return elements;
}

function extractTOCEntries(
  document: Parse5Node,
  urlToTopicsMap: Record<string, string[]>,
): TOCEntry[] {
  const tocTable = findElementsByTagName(document, "table").find((table) =>
    findElementsByTagName(table, "th").some((th) =>
      extractTextContent(th)?.includes("Nr")
    )
  );

  if (!tocTable) throw new Error("Could not find table of contents table");

  return findElementsByTagName(tocTable, "tr")
    .filter((row) => row.childNodes?.[0]?.nodeName !== "th")
    .map((row) => parseTOCRow(findElementsByTagName(row, "td"), urlToTopicsMap))
    .filter(Boolean) as TOCEntry[];
}

function parseTOCRow(
  cells: Parse5Node[],
  urlToTopicsMap: Record<string, string[]>,
): TOCEntry | null {
  if (cells.length < 4) return null;

  const number = extractTextContent(cells[0])?.trim();

  const titleLinks = findElementsByTagName(cells[2], "a");
  let title = "";
  let urlExternal = "";
  let urlInternal = "";

  for (const link of titleLinks) {
    const href = link.attrs?.find((attr) => attr.name === "href")?.value;
    if (!href) continue;

    if (href.startsWith("http://thebuildingcoder.typepad.com/")) {
      urlExternal = href;
      title = extractTextContent(link) || "";
    } else if (href.endsWith(".htm")) {
      urlInternal = href;
    }
  }

  // Get topics from our pre-built mapping
  const topics = urlToTopicsMap[urlExternal] || [];

  return {
    number,
    date: extractTextContent(cells[1])?.trim() || "",
    title,
    urlExternal,
    urlInternal,
    categories: extractTextContent(cells[3])?.trim() || "",
    topic: topics.join(", "),
  };
}

function findElementsByTagName(
  element: Parse5Node,
  tagName: string,
): Parse5Node[] {
  const results: Parse5Node[] = [];
  if (element.nodeName === tagName) results.push(element);
  for (const child of element.childNodes ?? []) {
    results.push(...findElementsByTagName(child, tagName));
  }
  return results;
}

function extractTextContent(element: Parse5Node): string {
  if (!element) return "";
  if (element.nodeName === "#text") return element.value || "";
  if (element.childNodes) {
    return (element.childNodes ?? []).map((child) => extractTextContent(child))
      .join("")
      .trim();
  }
  return "";
}

export function main() {
  try {
    const indexPath = join(
      Deno.cwd(),
      "..",
      "..",
      "..",
      "tbc",
      "a",
      "index.html",
    );
    const entries = scrapeIndex(indexPath);

    console.log(`Successfully scraped ${entries.length} entries`);

    // Only show first 10 entries for testing
    const testEntries = entries.slice(0, 10);
    console.log("\nFirst 10 entries:");
    for (const entry of testEntries) {
      console.log(`${entry.number}: ${entry.title} (${entry.date})`);
      console.log(`  Topic: ${entry.topic}`);
      console.log(`  Categories: ${entry.categories}`);
      console.log(`  External: ${entry.urlExternal}`);
      console.log(`  Internal: ${entry.urlInternal}\n`);
    }

    const entriesWithTopics = entries.filter((entry) => entry.topic !== "");
    console.log("=== TOPIC SUMMARY ===");
    console.log(`Total entries: ${entries.length}`);
    console.log(`Entries with topics: ${entriesWithTopics.length}`);
    console.log(
      `Entries without topics: ${entries.length - entriesWithTopics.length}`,
    );
    console.log(
      `Topic coverage: ${
        ((entriesWithTopics.length / entries.length) * 100).toFixed(1)
      }%`,
    );

    if (entriesWithTopics.length > 0) {
      console.log("\nSample entries with topics:");
      for (const entry of entriesWithTopics.slice(0, 3)) {
        console.log(
          `  ${entry.number}: ${entry.title} - Topic: ${entry.topic}`,
        );
      }
    }
    return entries;
  } catch (error) {
    console.error("Error scraping index:", error);
    throw error;
  }
}

if (import.meta.main) main();
