import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { household, householdMember, user } from "@/db/schema";

/**
 * Idempotently ensures a user has a household with an owner membership.
 * Safe to call on every sign-in and as a self-heal from requireHousehold()
 * for accounts whose original sign-in provisioning didn't complete (e.g. a
 * deploy with misconfigured DB/Supabase env vars).
 *
 * A transaction-scoped advisory lock keyed on the user serializes provisioning
 * per user, so the several concurrent RSC requests a single page render fires
 * (bottom-nav prefetch hits /week, /shopping, /settings at once) can't each
 * create a separate solo household. The lock releases automatically when the
 * transaction commits — safe under Supabase's transaction-mode pooling.
 */
export async function ensureHousehold(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint)`,
    );

    const existing = await tx
      .select({ id: householdMember.id })
      .from(householdMember)
      .where(eq(householdMember.userId, userId))
      .limit(1);

    if (existing.length > 0) return;

    const [u] = await tx
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const householdName = u?.name ? `Haushalt ${u.name}` : "Mein Haushalt";

    const [created] = await tx
      .insert(household)
      .values({ name: householdName, createdBy: userId })
      .returning({ id: household.id });

    await tx.insert(householdMember).values({
      householdId: created.id,
      userId,
      role: "owner",
    });
  });
}
