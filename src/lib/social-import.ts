import { parseHTML } from "linkedom";
import { fetchHtml } from "@/lib/fetch-html";
import { extractRecipeFromContent } from "@/lib/ai-import";
import type { ImageMediaType } from "@/lib/ai-providers/types";
import { parseHtml, type ParseResult } from "@/lib/recipe-parser";

const IMAGE_FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 5_000_000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// --- Platform detection ---------------------------------------------------

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "pinterest",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
};

/** What the AI prompt calls the text it is given, per platform. */
const CONTENT_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram-Bildunterschrift",
  facebook: "Facebook-Beitragstext",
  tiktok: "TikTok-Caption",
  youtube: "YouTube-Videobeschreibung",
  pinterest: "Pinterest-Pin-Beschreibung",
};

/**
 * Maps a URL onto the social platform it belongs to, or null for everything
 * else (those go through the JSON-LD parser). Short-link domains such as
 * youtu.be, fb.watch, vm.tiktok.com and pin.it are included — `fetchHtml`
 * follows their redirects.
 */
export function detectSocialPlatform(url: string): SocialPlatform | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^(www|m|web|mobile)\./, "");

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    return "instagram";
  }
  if (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.com" ||
    host === "fb.watch"
  ) {
    return "facebook";
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return "tiktok";
  }
  if (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  ) {
    return "youtube";
  }
  if (host === "pin.it" || /(^|\.)pinterest\.[a-z.]{2,}$/.test(host)) {
    return "pinterest";
  }
  return null;
}

// --- Caption cleanup ------------------------------------------------------

const GENERIC_CAPTION_PATTERNS = [
  /^(instagram|facebook|tiktok|pinterest|youtube)$/i,
  /^see this (post|photo|reel|video) on instagram/i,
  /^welcome back to instagram/i,
  /^log ?in to (see|view|watch)/i,
  /^sieh dir (diesen|dieses) (beitrag|video)/i,
  /^melde dich an/i,
  /^enjoy the videos and music you love/i,
  /^watch (the latest|short videos)/i,
  /^discover (recipes|short videos)/i,
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

/**
 * TikTok's og:description looks like
 * `12.3K Likes, 45 Comments. TikTok video from user (@handle): "caption".`
 */
export function cleanTikTokCaption(raw: string): string {
  const trimmed = raw.trim();
  const quoted = trimmed.match(/TikTok[^:]*:\s*[“"]([\s\S]*?)[”"]\.?\s*$/i);
  if (quoted) {
    return quoted[1].trim();
  }
  return trimmed;
}

export function isCaptionUsable(caption: string): boolean {
  const trimmed = caption.trim();
  if (trimmed.length < 15) return false;
  return !GENERIC_CAPTION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// --- HTML parsing ---------------------------------------------------------

type QueryableDocument = { querySelector(sel: string): Element | null };

function getMeta(document: QueryableDocument, property: string): string | null {
  const el =
    document.querySelector(`meta[property="${property}"]`) ??
    document.querySelector(`meta[name="${property}"]`);
  const content = el?.getAttribute?.("content")?.trim();
  return content ? content : null;
}

/**
 * YouTube truncates og:description, but the watch page ships the full video
 * description as a JSON string inside the player payload.
 */
export function extractYouTubeDescription(html: string): string | null {
  const match = html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
  if (!match) return null;
  try {
    const decoded = JSON.parse(`"${match[1]}"`) as string;
    const trimmed = decoded.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

export type SocialPageMeta = {
  usableCaption: string | null;
  rawImageUrl: string | null;
  title: string | null;
};

/** Pure HTML parsing step (no network) — extracted for easy unit testing. */
export function parseSocialHtml(
  html: string,
  platform: SocialPlatform,
): SocialPageMeta {
  const { document } = parseHTML(html);
  const title =
    getMeta(document, "og:title") ?? getMeta(document, "twitter:title");
  const rawImageUrl =
    getMeta(document, "og:image") ?? getMeta(document, "twitter:image");
  const description =
    getMeta(document, "og:description") ??
    getMeta(document, "twitter:description") ??
    getMeta(document, "description");

  let caption: string | null = null;
  if (platform === "youtube") {
    caption = extractYouTubeDescription(html) ?? description;
  } else if (platform === "instagram") {
    caption = description ? cleanInstagramCaption(description) : null;
  } else if (platform === "tiktok") {
    caption = description ? cleanTikTokCaption(description) : null;
  } else {
    caption = description;
  }

  const usableCaption = caption && isCaptionUsable(caption) ? caption : null;

  return { usableCaption, rawImageUrl, title };
}

// --- Image download -------------------------------------------------------

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

// --- Import ---------------------------------------------------------------

/**
 * A social import result plus whether it actually spent an AI call — the
 * caller only counts a call against the household's quota when it did.
 */
export type SocialImportOutcome = ParseResult & { usedAi: boolean };

/**
 * Best-effort automatic import for a social post URL: fetches the public page,
 * prefers embedded Recipe JSON-LD (free), and otherwise hands the caption —
 * or, failing that, the preview image — to the AI provider for structuring.
 *
 * All five platforms block unauthenticated fetches at least some of the time
 * (login walls, especially Instagram Reels and Facebook). That surfaces as a
 * graceful `no_recipe`/`fetch_failed` result, the same contract
 * `fetchRecipeFromUrl` uses, so callers don't need to special-case platforms.
 */
export async function fetchSocialRecipe(
  url: string,
  platform: SocialPlatform,
): Promise<SocialImportOutcome> {
  const html = await fetchHtml(url);
  if (html === null) {
    return { ok: false, code: "fetch_failed", usedAi: false };
  }

  // Pinterest pins (and the occasional Facebook page) carry the source site's
  // Recipe markup. Structured data beats an AI guess and costs nothing.
  const structured = parseHtml(html, url);
  if (structured.ok) {
    return { ...structured, usedAi: false };
  }

  const { usableCaption, rawImageUrl, title } = parseSocialHtml(html, platform);

  if (!usableCaption && !rawImageUrl) {
    return { ok: false, code: "no_recipe", fallbackTitle: title, usedAi: false };
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
    return { ok: false, code: "no_recipe", fallbackTitle: title, usedAi: false };
  }

  const extraction = await extractRecipeFromContent({
    captionText: usableCaption,
    contentLabel: CONTENT_LABELS[platform],
    imageBuffer,
    imageMediaType,
    sourceUrl: url,
    fallbackTitle: title,
  });

  if (!extraction.ok) {
    return { ok: false, code: "no_recipe", fallbackTitle: title, usedAi: true };
  }

  return { ok: true, recipe: extraction.recipe, rawImageUrl, usedAi: true };
}
