import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getClient() {
  if (globalForDb.client) return globalForDb.client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Check .env.local in dev, or env vars in prod.",
    );
  }
  const client = postgres(url, { max: 10, prepare: false });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }
  return client;
}

// Proxy defers client creation until first query, so importing this module
// doesn't fail in environments where DATABASE_URL isn't set (e.g. `next build`
// "collect page data" phase in a minimal Docker builder).
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!globalForDb.db) {
      globalForDb.db = drizzle(getClient(), { schema });
    }
    return Reflect.get(globalForDb.db, prop);
  },
});

export type Db = typeof db;
