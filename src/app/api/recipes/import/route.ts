import { NextResponse } from "next/server";
import { z } from "zod";
import { ForbiddenError, UnauthorizedError, getAuthUser, requireHousehold } from "@/lib/authz";
import { fetchRecipeFromUrl } from "@/lib/recipe-parser";
import { fetchInstagramRecipe } from "@/lib/instagram-import";
import { getMonthlyAiImportCount, recordAiImportUsage } from "@/lib/ai-usage";
import { uploadImageFromUrl } from "@/lib/storage";

const AI_IMPORT_MONTHLY_LIMIT = 40;

const bodySchema = z.object({
  url: z.string().trim().url().max(2000),
});

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimitOk(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const prev = hits.get(userId) ?? [];
  const recent = prev.filter((t) => t > windowStart);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!rateLimitOk(authUser.id)) {
    return NextResponse.json(
      { error: "Too many requests. Versuch's in einer Minute erneut." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige URL.", code: "invalid_url" },
      { status: 400 },
    );
  }

  const isInstagram = isInstagramUrl(parsed.data.url);

  let householdId: string | null = null;
  if (isInstagram) {
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
      return NextResponse.json(
        {
          error:
            "KI-Import-Limit für diesen Monat erreicht. Bitte trage das Rezept manuell ein.",
          code: "ai_limit_reached",
        },
        { status: 429 },
      );
    }
  }

  const result = isInstagram
    ? await fetchInstagramRecipe(parsed.data.url)
    : await fetchRecipeFromUrl(parsed.data.url);

  if (isInstagram && householdId) {
    await recordAiImportUsage(householdId, authUser.id, result.ok);
  }

  if (!result.ok) {
    if (result.code === "fetch_failed") {
      return NextResponse.json(
        {
          error:
            "Die Seite konnte nicht geladen werden. Versuch's in einem Moment erneut.",
          code: "fetch_failed",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Diese Seite unterstützt keinen automatischen Import. Trage das Rezept manuell ein.",
        code: "no_recipe",
        fallbackTitle: result.fallbackTitle,
      },
      { status: 422 },
    );
  }

  let imageUrl: string | null = null;
  let imageError: string | null = null;
  if (result.rawImageUrl) {
    const resolvedImageUrl = resolveUrl(
      result.rawImageUrl,
      parsed.data.url,
    );
    if (!resolvedImageUrl) {
      imageError = `invalid image URL: ${result.rawImageUrl}`;
      console.warn("[recipes/import] image", imageError);
    } else {
      const upload = await uploadImageFromUrl(resolvedImageUrl, {
        referer: parsed.data.url,
      });
      if (upload.ok) {
        imageUrl = upload.publicUrl;
      } else {
        imageError = `${upload.reason}: ${upload.detail ?? ""}`.trim();
        console.warn(
          "[recipes/import] image download failed",
          resolvedImageUrl,
          upload,
        );
      }
    }
  }

  return NextResponse.json({
    recipe: { ...result.recipe, imageUrl },
    imageSourceUrl: result.rawImageUrl,
    imageError,
  });
}

function isInstagramUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === "instagram.com";
  } catch {
    return false;
  }
}

function resolveUrl(raw: string, base: string): string | null {
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}
