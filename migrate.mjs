import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "migrations");

console.log("Running database migrations...");
await migrate(db, { migrationsFolder });
console.log("Migrations complete.");
await client.end();
