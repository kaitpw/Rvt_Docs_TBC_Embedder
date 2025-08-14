# Rvt_Docs_TBC_Embedder

This is a sister project to
[Rvt_Docs_MCP](https://github.com/kaitpw/Rvt_Docs_MCP) which is an MCP server to
help with Revit development. One of its tools, "search-library" requires an
OpenAI vector store. This project creates that vector store which contains The
Building Coder (TBC) Blog posts. More content may be added in the future such as
C# code examples, miscellaneous pdfs, and more.

Unfortunately AI is not free, though it is getting cheaper. Thus you must use
your own API keys. This project makes it easy to do this for yourself.

# Usage

General Steps:

1. Clone this repo
2. Get OpenAI API key
3. run `deno task make`
4. Use vector store with Rvt_Docs_MCP

> **NOTE**: This project uses the TBC blog's source code as a git submodule. Git
> submodules also clone when you clone the parent repo. Because the TBC repo is
> huge, cloning this repo will take substantially longer than your probably used
> to. There is also some funniness with the TBC repo which will show a warning
> after cloning, and also make it look like you changed the repo. Ignore this.
> when staging and/or committing, these "changes" will be ignored.

> **NOTE**: `deno task make` itself utilizes 4 other commands which you will
> find in `deno.json` and are explained in the following section. This may take
> a few minutes, just bear with it.

> **NOTE**: Each run of this `deno task make` will make a new vector store. It
> will not add duplicated files to the file store though

To get your API key, go to the OpenAI console and make one. You'll have to make
an account and add billing info if you have not already. Then use your prefered
way of setting environment variables. Standard for JS/TS projects is a `.env`
file that you make at the root of this project (that path would be
`Rvt_Docs_Tbc_Embedder/.env`). There are a large variety of other ways to set
env vars depending on your preferences and OS. I have not personally tested
these alternatives but in theory they should work.

To make your own vector store, run `deno task make` in your terminal. As you may
expect, this requires the deno runtime being installed on your computer. Install
Deno on your system with the appropriate command from
[this page](https://docs.deno.com/runtime/getting_started/installation/).

`deno task make` will print the **vector store ID** after completion, it looks
like "vs_12lj3r...". You can also find the ID in your OpenAI console > File
Storage > Vector Stores. The store's name will include the timestamp for the
when it was created (which should be a few minutes before the completion of
`deno task make`). Follow instructions in Rvt_Docs_MCP on how to use the ID.

## Available Commands

### `deno task db:generate`

Generates Drizzle schema for PGlite.

### `deno task db:init`

Initializes a PGLite database at your project root.

### `deno task db:seed`

Seeds the PGlite database with data from the TBC blog git submodule. This takes
a moment

### `deno task files:upload`

Uploads files to OpenAI file storage, then adds those files to a new vector
store (makes a new vector store everytime this is run). Logs a summary including
the vector store ID. This command takes a few minutes.

### `deno task make`

Runs all 4 of the above commands in sequence.

### `deno task db:studio`

If for fun you want to look at the database contents, run this. If you only want
to see the database, but don't want to make a vector store, run
`deno task db:generate`, `deno task db:init`, and `deno task db:seed` in
sequence. then run this.

### Delete all OpenAI files

You probably shouldn't do this but you can delete all of you OpenAI File Storage
files with `deno run -A src/openai-tbc-pages/scripts/delete-all-files.ts`. This
is desctructive and will break any vector stores you have. It only exists for
development purposes.
