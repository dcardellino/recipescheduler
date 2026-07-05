import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Migrations (DDL) must run over a direct connection, not the transaction
// pooler. Falls back to DATABASE_URL for local setups without a separate pooler.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DIRECT_URL (or DATABASE_URL) is not set. Check .env.local.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
