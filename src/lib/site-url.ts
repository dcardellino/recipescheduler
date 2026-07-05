/**
 * Public base URL of the app. Used to build magic-link redirect targets and
 * invite links. Set NEXT_PUBLIC_SITE_URL in production (e.g. the Vercel URL).
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
