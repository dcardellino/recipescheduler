import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY ?? "minio";
const secretAccessKey = process.env.MINIO_SECRET_KEY ?? "minio12345";
export const bucket = process.env.MINIO_BUCKET ?? "recipes";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function proxyUrl(key: string) {
  return `${appUrl}/api/storage/${key}`;
}

export const s3 = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  opts: { prefix?: string } = {},
): Promise<{ publicUrl: string; key: string }> {
  const { prefix = "uploads" } = opts;
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${randomUUID()}-${safeName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return { publicUrl: proxyUrl(`${bucket}/${key}`), key };
}

const MAX_IMAGE_BYTES = 10_000_000;
const IMAGE_FETCH_TIMEOUT_MS = 10_000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export type ImageUploadResult =
  | { ok: true; publicUrl: string }
  | {
      ok: false;
      reason:
        | "invalid_url"
        | "fetch_failed"
        | "not_an_image"
        | "too_large"
        | "upload_failed";
      detail?: string;
    };

export async function uploadImageFromUrl(
  sourceUrl: string,
  opts: { prefix?: string; referer?: string } = {},
): Promise<ImageUploadResult> {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return { ok: false, reason: "invalid_url", detail: sourceUrl };
  }
  const { prefix = "imports", referer } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "User-Agent": BROWSER_UA,
      Accept: "image/*,*/*;q=0.8",
    };
    if (referer) headers.Referer = referer;

    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers,
    });
    if (!res.ok) {
      return {
        ok: false,
        reason: "fetch_failed",
        detail: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return { ok: false, reason: "not_an_image", detail: contentType };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength === 0) {
      return { ok: false, reason: "fetch_failed", detail: "empty body" };
    }
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        reason: "too_large",
        detail: `${buffer.byteLength} bytes`,
      };
    }

    const ext = extensionFromContentType(contentType);
    const key = `${prefix}/${randomUUID()}${ext}`;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      return {
        ok: false,
        reason: "upload_failed",
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    return {
      ok: true,
      publicUrl: proxyUrl(`${bucket}/${key}`),
    };
  } catch (err) {
    return {
      ok: false,
      reason: "fetch_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extensionFromContentType(contentType: string): string {
  const base = contentType.split(";")[0].trim().toLowerCase();
  switch (base) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    default:
      return "";
  }
}
