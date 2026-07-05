"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { household, householdMember, user } from "@/db/schema";
import { assertOwnerRole, requireHousehold } from "@/lib/authz";
import { sendHouseholdInviteEmail } from "@/lib/email";
import { signInviteToken, verifyInviteToken } from "@/lib/invite-token";
import { getSiteUrl } from "@/lib/site-url";

export async function inviteMember(email: string): Promise<void> {
  const ctx = await requireHousehold();
  assertOwnerRole(ctx);

  const parsedEmail = z.string().email("Ungültige E-Mail-Adresse").parse(email);

  const [alreadyMember] = await db
    .select({ id: householdMember.id })
    .from(householdMember)
    .innerJoin(user, eq(user.id, householdMember.userId))
    .where(
      and(
        eq(householdMember.householdId, ctx.householdId),
        eq(user.email, parsedEmail),
      ),
    )
    .limit(1);

  if (alreadyMember) {
    throw new Error("Diese Person ist bereits Mitglied dieses Haushalts.");
  }

  const [[hh], [inviter]] = await Promise.all([
    db
      .select({ name: household.name })
      .from(household)
      .where(eq(household.id, ctx.householdId))
      .limit(1),
    db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, ctx.userId))
      .limit(1),
  ]);

  const token = await signInviteToken({
    email: parsedEmail,
    hid: ctx.householdId,
  });

  const url = `${getSiteUrl()}/invite?token=${token}`;

  await sendHouseholdInviteEmail(
    parsedEmail,
    inviter?.name ?? "Jemand",
    hh?.name ?? "Mein Haushalt",
    url,
  );
}

export async function updateHouseholdName(name: string): Promise<void> {
  const ctx = await requireHousehold();
  assertOwnerRole(ctx);

  const parsedName = z.string().trim().min(1).max(80).parse(name);

  await db
    .update(household)
    .set({ name: parsedName, updatedAt: new Date() })
    .where(eq(household.id, ctx.householdId));

  revalidatePath("/settings");
}

export async function removeMember(targetUserId: string): Promise<void> {
  const ctx = await requireHousehold();
  assertOwnerRole(ctx);

  if (targetUserId === ctx.userId) {
    throw new Error("Du kannst dich nicht selbst entfernen.");
  }

  await db
    .delete(householdMember)
    .where(
      and(
        eq(householdMember.householdId, ctx.householdId),
        eq(householdMember.userId, targetUserId),
      ),
    );

  revalidatePath("/settings");
}

export async function joinHousehold(token: string): Promise<void> {
  const ctx = await requireHousehold();
  const payload = await verifyInviteToken(token);

  await db.transaction(async (tx) => {
    const [alreadyIn] = await tx
      .select({ id: householdMember.id })
      .from(householdMember)
      .where(
        and(
          eq(householdMember.userId, ctx.userId),
          eq(householdMember.householdId, payload.hid),
        ),
      )
      .limit(1);

    if (alreadyIn) return;

    // Remove current membership before joining the invited household.
    // New users have no data in their auto-created solo household, so this is safe.
    // If ownership transfer is needed in the future, add a guard here.
    await tx
      .delete(householdMember)
      .where(eq(householdMember.userId, ctx.userId));

    await tx.insert(householdMember).values({
      householdId: payload.hid,
      userId: ctx.userId,
      role: "member",
    });
  });

  revalidatePath("/settings");
  revalidatePath("/recipes");
}
