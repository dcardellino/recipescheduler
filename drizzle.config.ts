import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Migrations (DDL) must run over a direct connection, not the transaction
// pooler. POSTGRES_URL_NON_POOLING is the direct connection from the
// Vercel↔Supabase integration; the pooled URLs are last-resort fallbacks for
// local setups without a separate direct connection.
const url =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;
if (!url) {
  throw new Error(
    "DIRECT_URL / POSTGRES_URL_NON_POOLING (or DATABASE_URL / POSTGRES_URL) is not set. Check .env.local.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
