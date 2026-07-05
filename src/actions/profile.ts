"use server";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * Upserts the local profile row for a Supabase Auth user. The profile `id`
 * mirrors auth.users.id. Called on first sign-in from the auth callback.
 */
export async function ensureProfile(authUser: SupabaseUser): Promise<void> {
  const email = (authUser.email ?? "").toLowerCase();
  const metadata = authUser.user_metadata ?? {};
  const name =
    (typeof metadata.name === "string" && metadata.name) ||
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (email ? email.split("@")[0] : "") ||
    "Unbekannt";

  await db
    .insert(user)
    .values({ id: authUser.id, email, name })
    .onConflictDoUpdate({
      target: user.id,
      set: { email, updatedAt: new Date() },
    });
}
