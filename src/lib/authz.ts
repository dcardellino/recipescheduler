import "server-only";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { householdMember } from "@/db/schema";
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

export async function requireHousehold(): Promise<HouseholdContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const [membership] = await db
    .select({
      householdId: householdMember.householdId,
      role: householdMember.role,
    })
    .from(householdMember)
    .where(eq(householdMember.userId, session.user.id))
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("Kein Haushalt gefunden");
  }

  return {
    userId: session.user.id,
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
