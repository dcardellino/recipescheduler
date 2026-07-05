"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyInviteToken, JoseErrors } from "@/lib/invite-token";
import { getSiteUrl } from "@/lib/site-url";

const emailSchema = z
  .string()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus.");

export type LoginLinkResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a passwordless magic-link sign-in email via Supabase Auth.
 *
 * Registration is invite-only: an email that doesn't yet belong to a user is
 * only allowed to sign up when it presents a valid, matching invite token.
 * Existing users can always request a link.
 */
export async function requestLoginLink(input: {
  email: string;
  next?: string;
  inviteToken?: string;
}): Promise<LoginLinkResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige E-Mail." };
  }
  const email = parsed.data.toLowerCase();

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true },
  });

  let shouldCreateUser = false;
  if (existing) {
    shouldCreateUser = false;
  } else if (input.inviteToken) {
    try {
      const payload = await verifyInviteToken(input.inviteToken);
      if (payload.email.toLowerCase() !== email) {
        return { ok: false, error: "Diese Einladung ist für eine andere E-Mail-Adresse." };
      }
      shouldCreateUser = true;
    } catch (err) {
      if (err instanceof JoseErrors.JWTExpired) {
        return { ok: false, error: "Der Einladungslink ist abgelaufen." };
      }
      return { ok: false, error: "Ungültiger Einladungslink." };
    }
  } else {
    return {
      ok: false,
      error: "Registrierung ist nur mit einer Einladung möglich.",
    };
  }

  const next = input.next && input.next.startsWith("/") ? input.next : "/recipes";
  const emailRedirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser, emailRedirectTo },
  });

  if (error) {
    return {
      ok: false,
      error: "Der Link konnte nicht gesendet werden. Bitte versuch es gleich nochmal.",
    };
  }

  return { ok: true };
}
