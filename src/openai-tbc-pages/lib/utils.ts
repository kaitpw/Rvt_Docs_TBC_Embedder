import "jsr:@std/dotenv/load";
import OpenAI from "openai";

export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export const client = new OpenAI({ apiKey: OPENAI_API_KEY });
