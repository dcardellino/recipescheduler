"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { tag } from "@/db/schema";
import { requireHousehold } from "@/lib/authz";

const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag darf nicht leer sein.")
  .max(60, "Maximal 60 Zeichen.");

export async function createTag(
  name: string,
): Promise<{ id: string; name: string }> {
  const ctx = await requireHousehold();
  const parsed = tagNameSchema.parse(name);

  const [existing] = await db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(and(eq(tag.householdId, ctx.householdId), eq(tag.name, parsed)))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(tag)
    .values({ householdId: ctx.householdId, name: parsed })
    .returning({ id: tag.id, name: tag.name });

  revalidatePath("/recipes");
  return created;
}

export async function listMyTags(): Promise<{ id: string; name: string }[]> {
  const ctx = await requireHousehold();
  return db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(eq(tag.householdId, ctx.householdId))
    .orderBy(asc(tag.name));
}
