import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { household, householdMember, user } from "@/db/schema";
import { requireHousehold } from "@/lib/authz";
import type { HouseholdRole } from "@/db/schema";

export type HouseholdMemberInfo = {
  userId: string;
  name: string | null;
  email: string;
  role: HouseholdRole;
  joinedAt: Date;
};

export type HouseholdSettings = {
  householdId: string;
  householdName: string;
  currentUserId: string;
  currentUserRole: HouseholdRole;
  members: HouseholdMemberInfo[];
};

export async function getHouseholdSettings(): Promise<HouseholdSettings> {
  const ctx = await requireHousehold();

  const [[hh], members] = await Promise.all([
    db
      .select({ name: household.name })
      .from(household)
      .where(eq(household.id, ctx.householdId))
      .limit(1),
    db
      .select({
        userId: householdMember.userId,
        role: householdMember.role,
        joinedAt: householdMember.joinedAt,
        name: user.name,
        email: user.email,
      })
      .from(householdMember)
      .innerJoin(user, eq(user.id, householdMember.userId))
      .where(eq(householdMember.householdId, ctx.householdId))
      .orderBy(householdMember.joinedAt),
  ]);

  return {
    householdId: ctx.householdId,
    householdName: hh?.name ?? "Mein Haushalt",
    currentUserId: ctx.userId,
    currentUserRole: ctx.role,
    members,
  };
}
