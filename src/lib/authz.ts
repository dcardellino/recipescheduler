import "server-only";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { householdMember, user } from "@/db/schema";
import type { HouseholdRole } from "@/db/schema";

export class UnauthorizedError extends Error {
  constructor(message = "Nicht angemeldet") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Kein Zugriff") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type HouseholdContext = {
  userId: string;
  householdId: string;
  role: HouseholdRole;
};

/** Returns the current Supabase Auth user, or null if not signed in. */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  return authUser;
}

export type SessionUser = { id: string; email: string; name: string | null };

/**
 * Returns the current user merged with their local profile (name/email), or
 * null if not signed in. Used to render account UI.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const [profile] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, authUser.id))
    .limit(1);

  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? "",
    name: profile?.name ?? null,
  };
}

export async function requireHousehold(): Promise<HouseholdContext> {
  const authUser = await getAuthUser();
  if (!authUser) {
    throw new UnauthorizedError();
  }

  const [membership] = await db
    .select({
      householdId: householdMember.householdId,
      role: householdMember.role,
    })
    .from(householdMember)
    .where(eq(householdMember.userId, authUser.id))
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("Kein Haushalt gefunden");
  }

  return {
    userId: authUser.id,
    householdId: membership.householdId,
    role: membership.role,
  };
}

export function requireHouseholdAccess(
  ctx: HouseholdContext,
  resourceHouseholdId: string,
): void {
  if (ctx.householdId !== resourceHouseholdId) {
    throw new ForbiddenError("Kein Zugriff auf diese Ressource.");
  }
}

export function assertOwnerRole(ctx: HouseholdContext): void {
  if (ctx.role !== "owner") {
    throw new ForbiddenError("Nur Haushaltseigentümer können das tun.");
  }
}
