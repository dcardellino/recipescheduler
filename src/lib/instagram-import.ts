import { parseHTML } from "linkedom";
import { fetchHtml } from "@/lib/fetch-html";
import { extractRecipeFromInstagram } from "@/lib/ai-import";
import type { ImageMediaType } from "@/lib/ai-providers/types";
import type { ParseResult } from "@/lib/recipe-parser";

const IMAGE_FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 5_000_000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const GENERIC_CAPTION_PATTERNS = [
  /^instagram$/i,
  /^see this (post|photo|reel|video) on instagram/i,
  /^welcome back to instagram/i,
  /^log in to (see|view) (this )?post/i,
];

/**
 * Instagram's og:description is typically shaped like
 * `123 Likes, 4 Comments - user (@handle) on Instagram: "actual caption"`
 * (or, without the "Instagram" mention, `... - user on <date>: "actual caption"`).
 * We strip the boilerplate prefix to get at the real caption text.
 */
export function cleanInstagramCaption(raw: string): string {
  const trimmed = raw.trim();

  const withInstagramLabel = trimmed.match(/on Instagram:\s*"([\s\S]*)"\s*$/i);
  if (withInstagramLabel) {
    return withInstagramLabel[1].trim();
  }

  const withDateLabel = trimmed.match(/-\s*[^:]+:\s*"([\s\S]*)"\s*$/);
  if (withDateLabel) {
    return withDateLabel[1].trim();
  }

  return trimmed;
}

export function isCaptionUsable(caption: string): boolean {
  const trimmed = caption.trim();
  if (trimmed.length < 15) return false;
  return !GENERIC_CAPTION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function normalizeImageMediaType(contentType: string | null): ImageMediaType | null {
  const base = (contentType ?? "").split(";")[0].trim().toLowerCase();
  switch (base) {
    case "image/jpeg":
    case "image/jpg":
      return "image/jpeg";
    case "image/png":
      return "image/png";
    case "image/gif":
      return "image/gif";
    case "image/webp":
      return "image/webp";
    default:
      return null;
  }
}

async function downloadImage(
  imageUrl: string,
  referer: string,
): Promise<{ buffer: Buffer; mediaType: ImageMediaType } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "image/*,*/*;q=0.8",
        Referer: referer,
      },
    });
    if (!res.ok) return null;

    const mediaType = normalizeImageMediaType(res.headers.get("content-type"));
    if (!mediaType) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

    return { buffer, mediaType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getMeta(
  document: { querySelector(sel: string): Element | null },
  property: string,
): string | null {
  const el = document.querySelector(`meta[property="${property}"]`);
  const content = el?.getAttribute?.("content")?.trim();
  return content ? content : null;
}

export type InstagramPageMeta = {
  usableCaption: string | null;
  rawImageUrl: string | null;
  title: string | null;
};

/** Pure HTML parsing step (no network) — extracted for easy unit testing. */
export function parseInstagramHtml(html: string): InstagramPageMeta {
  const { document } = parseHTML(html);
  const rawDescription = getMeta(document, "og:description");
  const rawImageUrl = getMeta(document, "og:image");
  const title = getMeta(document, "og:title");

  const caption = rawDescription ? cleanInstagramCaption(rawDescription) : null;
  const usableCaption = caption && isCaptionUsable(caption) ? caption : null;

  return { usableCaption, rawImageUrl, title };
}

/**
 * Best-effort automatic import for an Instagram post URL: fetches the public
 * page, pulls og:description (caption) / og:image / og:title, and hands the
 * caption (or, failing that, the image) to Claude for structuring. Instagram
 * frequently blocks unauthenticated fetches (login walls, especially for
 * Reels) — that surfaces as a graceful `no_recipe`/`fetch_failed` result, the
 * same contract `fetchRecipeFromUrl` uses, so callers don't need to special-case
 * Instagram.
 */
export async function fetchInstagramRecipe(url: string): Promise<ParseResult> {
  const html = await fetchHtml(url);
  if (html === null) {
    return { ok: false, code: "fetch_failed" };
  }

  const { usableCaption, rawImageUrl, title } = parseInstagramHtml(html);

  if (!usableCaption && !rawImageUrl) {
    return { ok: false, code: "no_recipe", fallbackTitle: title };
  }

  let imageBuffer: Buffer | null = null;
  let imageMediaType: ImageMediaType | null = null;
  if (!usableCaption && rawImageUrl) {
    const downloaded = await downloadImage(rawImageUrl, url);
    if (downloaded) {
      imageBuffer = downloaded.buffer;
      imageMediaType = downloaded.mediaType;
    }
  }

  if (!usableCaption && !imageBuffer) {
    return { ok: false, code: "no_recipe", fallbackTitle: title };
  }

  const extraction = await extractRecipeFromInstagram({
    captionText: usableCaption,
    imageBuffer,
    imageMediaType,
    sourceUrl: url,
    fallbackTitle: title,
  });

  if (!extraction.ok) {
    return { ok: false, code: "no_recipe", fallbackTitle: title };
  }

  return { ok: true, recipe: extraction.recipe, rawImageUrl };
}
