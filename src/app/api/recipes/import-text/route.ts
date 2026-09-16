import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ForbiddenError,
  UnauthorizedError,
  getAuthUser,
  requireHousehold,
} from "@/lib/authz";
import { extractRecipeFromContent, isAiImportConfigured } from "@/lib/ai-import";
import { getMonthlyAiImportCount, recordAiImportUsage } from "@/lib/ai-usage";
import {
  AI_IMPORT_MONTHLY_LIMIT,
  aiLimitResponse,
  importRateLimitOk,
  rateLimitResponse,
} from "@/lib/import-limits";

/**
 * Structures a recipe pasted from anywhere — Paprika, Apple Notes, Google
 * Docs, Notion, Evernote, a WhatsApp message — into the app's recipe shape.
 * Always an AI call, so it shares the household's monthly import budget with
 * the social-post importer.
 */

const bodySchema = z.object({
  text: z
    .string()
    .trim()
    .min(30, "Der Text ist zu kurz für ein Rezept.")
    .max(20_000, "Der Text ist zu lang (maximal 20.000 Zeichen)."),
  sourceUrl: z.string().trim().url().max(1000).optional().nullable(),
});

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!importRateLimitOk(authUser.id)) {
    return rateLimitResponse();
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Der eingefügte Text ist ungültig.",
        code: "invalid_text",
      },
      { status: 400 },
    );
  }

  if (!isAiImportConfigured()) {
    return NextResponse.json(
      {
        error:
          "Der KI-Import ist auf diesem Server nicht konfiguriert. Trage das Rezept manuell ein.",
        code: "ai_unavailable",
      },
      { status: 503 },
    );
  }

  let householdId: string;
  try {
    ({ householdId } = await requireHousehold());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const usageCount = await getMonthlyAiImportCount(householdId);
  if (usageCount >= AI_IMPORT_MONTHLY_LIMIT) {
    return aiLimitResponse();
  }

  const extraction = await extractRecipeFromContent({
    captionText: parsed.data.text,
    contentLabel: "Eingefügter Rezepttext",
    sourceUrl: parsed.data.sourceUrl ?? null,
  });

  await recordAiImportUsage(
    householdId,
    authUser.id,
    extraction.ok,
    extraction.tokensUsed,
  );

  if (!extraction.ok) {
    return NextResponse.json(
      {
        error:
          "Aus dem Text konnten wir kein Rezept lesen. Prüfe, ob Zutaten und Zubereitung enthalten sind.",
        code: "no_recipe",
        fallbackTitle: null,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ recipe: extraction.recipe });
}
