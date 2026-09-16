import { NextResponse } from "next/server";
import { z } from "zod";
import { ForbiddenError, UnauthorizedError, getAuthUser, requireHousehold } from "@/lib/authz";
import { fetchRecipeFromUrl } from "@/lib/recipe-parser";
import { detectSocialPlatform, fetchSocialRecipe } from "@/lib/social-import";
import { getMonthlyAiImportCount, recordAiImportUsage } from "@/lib/ai-usage";
import {
  AI_IMPORT_MONTHLY_LIMIT,
  aiLimitResponse,
  importRateLimitOk,
  rateLimitResponse,
} from "@/lib/import-limits";
import { uploadImageFromUrl } from "@/lib/storage";

const bodySchema = z.object({
  url: z.string().trim().url().max(2000),
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
      { error: "Ungültige URL.", code: "invalid_url" },
      { status: 400 },
    );
  }

  const platform = detectSocialPlatform(parsed.data.url);

  let householdId: string | null = null;
  if (platform) {
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
  }

  const result = platform
    ? await fetchSocialRecipe(parsed.data.url, platform)
    : await fetchRecipeFromUrl(parsed.data.url);

  // Only a run that actually called the provider counts against the quota —
  // a social post whose page carried Recipe JSON-LD costs nothing.
  if (householdId && "usedAi" in result && result.usedAi) {
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
        error: platform
          ? "Aus diesem Post konnten wir kein Rezept lesen — viele Posts sind ohne Login nicht abrufbar. Kopier den Text in den Tab „Text einfügen“ oder trage das Rezept manuell ein."
          : "Diese Seite unterstützt keinen automatischen Import. Trage das Rezept manuell ein.",
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

function resolveUrl(raw: string, base: string): string | null {
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}
