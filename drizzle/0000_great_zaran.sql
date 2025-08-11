CREATE SCHEMA "tbc";
--> statement-breakpoint
CREATE TABLE "tbc"."tbc_pages" (
	"number" varchar(4) PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"title" varchar(255) NOT NULL,
	"urlExternal" varchar(255) NOT NULL,
	"urlInternal" varchar(255) NOT NULL,
	"categories" varchar(255) NOT NULL,
	"topic" varchar(255),
	"content" text NOT NULL
);
