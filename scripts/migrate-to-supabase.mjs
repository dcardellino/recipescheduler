/**
 * One-time data migration: old self-hosted Postgres → Supabase.
 *
 * Copies all structured data from the old database into the freshly-migrated
 * Supabase database, creating a Supabase Auth user for each existing profile
 * and remapping the old text user IDs to the new auth.users UUIDs.
 *
 * Prerequisites:
 *   1. The Supabase schema is already migrated (`npm run db:migrate`).
 *   2. The target Supabase DB is empty (no households/recipes yet).
 *
 * Required env vars:
 *   OLD_DATABASE_URL           postgres connection to the OLD database (source)
 *   DIRECT_URL                 Supabase direct connection (target, port 5432)
 *   NEXT_PUBLIC_SUPABASE_URL   Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase service-role key (creates auth users)
 *
 * Usage:
 *   node scripts/migrate-to-supabase.mjs            # dry run (no writes)
 *   node scripts/migrate-to-supabase.mjs --commit   # perform the migration
 *
 * NOTE on images: recipe.image_url values still point at the old storage proxy
 * (`/api/storage/...`). Copy the image objects into the Supabase bucket and
 * rewrite these URLs separately — see docs/deployment.md. This script leaves
 * image_url untouched.
 */
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const COMMIT = process.argv.includes("--commit");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const OLD_DATABASE_URL = requireEnv("OLD_DATABASE_URL");
const DIRECT_URL = requireEnv("DIRECT_URL");
const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const src = postgres(OLD_DATABASE_URL, { max: 1 });
const dst = postgres(DIRECT_URL, { max: 1 });
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Tables copied in FK-safe order. The `user` table is handled specially (auth).
const TABLES = [
  "household",
  "household_member",
  "tag",
  "recipe",
  "recipe_component",
  "recipe_ingredient",
  "recipe_step",
  "recipe_tag",
  "meal_plan_entry",
  "shopping_list",
  "shopping_list_item",
];

const USER_ID_COLUMNS = {
  household: ["created_by"],
  household_member: ["user_id"],
  recipe: ["created_by"],
};

async function main() {
  console.log(`\n${COMMIT ? "COMMIT" : "DRY RUN"} — migrating to Supabase\n`);

  // 1. Users → Supabase Auth + id map.
  const oldUsers = await src`SELECT id, email, name FROM "user" ORDER BY created_at`;
  const idMap = new Map();

  for (const u of oldUsers) {
    const email = String(u.email).toLowerCase();
    console.log(`user: ${email}`);
    if (!COMMIT) {
      idMap.set(u.id, "00000000-0000-0000-0000-000000000000");
      continue;
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: u.name },
    });
    if (error) throw new Error(`createUser(${email}): ${error.message}`);
    idMap.set(u.id, data.user.id);
    await dst`
      INSERT INTO "user" (id, name, email)
      VALUES (${data.user.id}, ${u.name}, ${email})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`\n${oldUsers.length} users mapped.\n`);

  // 2. Copy domain tables, remapping user-id columns.
  for (const table of TABLES) {
    const rows = await src`SELECT * FROM ${src(table)}`;
    console.log(`${table}: ${rows.length} rows`);
    if (!COMMIT || rows.length === 0) continue;

    const remapCols = USER_ID_COLUMNS[table] ?? [];
    const mapped = rows.map((row) => {
      const copy = { ...row };
      for (const col of remapCols) {
        if (copy[col] != null) {
          const newId = idMap.get(copy[col]);
          copy[col] = newId ?? null; // set-null FKs tolerate unknown users
        }
      }
      return copy;
    });

    await dst`INSERT INTO ${dst(table)} ${dst(mapped)}`;
  }

  console.log(`\n✓ ${COMMIT ? "Migration complete." : "Dry run complete — re-run with --commit."}\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await src.end();
    await dst.end();
  });
