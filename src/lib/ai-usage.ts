import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { aiImportUsage } from "@/db/schema";

const USAGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function getMonthlyAiImportCount(householdId: string): Promise<number> {
  const windowStart = new Date(Date.now() - USAGE_WINDOW_MS);

  const [row] = await db
    .select({ value: count() })
    .from(aiImportUsage)
    .where(
      and(
        eq(aiImportUsage.householdId, householdId),
        gte(aiImportUsage.createdAt, windowStart),
      ),
    );

  return row?.value ?? 0;
}

export async function recordAiImportUsage(
  householdId: string,
  userId: string,
  success: boolean,
  tokensUsed?: number,
): Promise<void> {
  await db.insert(aiImportUsage).values({
    householdId,
    userId,
    success,
    tokensUsed: tokensUsed ?? null,
  });
}
