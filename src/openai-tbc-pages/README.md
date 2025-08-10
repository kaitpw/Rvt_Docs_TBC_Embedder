This directory contains only code related to adding tbc html pages to OpenAI's
file storage and vector store. Run all kebab-case scripts with
`deno run -A <file-name.ts>`

- scripts/file-storage-upload.ts - uploads tbc html pages to openai file storage
- scripts/vector-store-add.ts - adds _tbc_ file-storage-files to the tbc-pages
  vector store
- scripts/vector-store-count.ts - counts files in vector store, just for
  verification purposes
- lib/tbcPagesFileUtils.ts - common tbc file processing logic

# SPEC

## Context

The purpose of this repo is to upload the source of a blog to OpenAI file
storage in order to perform Retrieval (basically RAG) on it. The source is
contained in a repo called `tbc` which is added as a submodule to this repo. The
files of interest for us are the htm and htmls with the 4-digit prefix at the
top-level of the `a/` directory:

tbc/\
├── ... # other stuff\
└── a/ # (IMPORTANT) Main content directory\
├── 0001_welcome.htm # Blog posts (chronological numbering)\
├── ... # Hundreds of numbered HTML blog posts\
├── 2071_gen_ai_rag.html\
├── doc/ # random documents files\
├── img/ # Images\
└── zip/ # Downloadable resources, pdfs, mp4sa, zips, pptx, cs, etc.

Notes about `a/` top-level files:

- Many of the files are .md counterparts to .html's or .htm's. They have the
  same name and (almost) same content.
- There exists a file `a/index.html` that contains whats basically a site map
  for all the pages with categories and tags

## Process and Upload Steps

Given there there is a lot of junk in the tbc submodule, but also that we want
to be able to rerun this process/upload workflow when tbc is updated, we must do
some in-memory processing before uploading:

- for each page (denoted by a unique 4-digit prefix) get the html/htm. In the
  case where neither exists, but and md does, then use the md
- for htm's simply rename them to be html

Then upload the file to the file store and add it to the vector store. Take
advantage of batching here.

Architect this workflow repeatability/idempotency in mind. If a file exists
already. Don't upload it.

**OPENAI_API_KEY** and **OPENAI_VECTOR_STORE_ID** are both in the `.env` file
