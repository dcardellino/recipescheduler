"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureProfile } from "@/actions/profile";
import { ensureHousehold } from "@/lib/provisioning";
import { verifyInviteToken, JoseErrors } from "@/lib/invite-token";

const emailSchema = z
  .string()
  .min(1, "Bitte gib deine E-Mail-Adresse ein.")
  .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus.");

const passwordSchema = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.");

export type AuthResult = { ok: true } | { ok: false; error: string };

/** Sign in an existing user with email + password. */
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Bitte gib dein Passwort ein.") })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const email = parsed.data.email.toLowerCase();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, error: "E-Mail oder Passwort ist falsch." };
  }

  // Defensive, idempotent provisioning (existing users already have these).
  await ensureProfile(data.user);
  await ensureHousehold(data.user.id);

  return { ok: true };
}

/**
 * Registers a new user with email + password — invite-only. The account is
 * created server-side with the service role (email pre-confirmed), then signed
 * in. Household join happens on the invite page after sign-in.
 */
export async function registerWithInvite(input: {
  email: string;
  password: string;
  name: string;
  inviteToken: string;
}): Promise<AuthResult> {
  const parsed = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      name: z.string().trim().min(1, "Bitte gib deinen Namen ein.").max(80),
      inviteToken: z.string().min(1),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }
  const email = parsed.data.email.toLowerCase();

  // Validate the invite before creating anything.
  try {
    const payload = await verifyInviteToken(parsed.data.inviteToken);
    if (payload.email.toLowerCase() !== email) {
      return { ok: false, error: "Diese Einladung ist für eine andere E-Mail-Adresse." };
    }
  } catch (err) {
    if (err instanceof JoseErrors.JWTExpired) {
      return { ok: false, error: "Der Einladungslink ist abgelaufen." };
    }
    return { ok: false, error: "Ungültiger Einladungslink." };
  }

  // Reject if the email already has an account.
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Für diese E-Mail existiert bereits ein Account. Bitte einloggen." };
  }

  const admin = getSupabaseAdmin();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });
  if (createError || !created.user) {
    return { ok: false, error: "Account konnte nicht angelegt werden. Bitte versuch es erneut." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (signInError || !signedIn.user) {
    return { ok: false, error: "Anmeldung nach der Registrierung fehlgeschlagen." };
  }

  await ensureProfile(signedIn.user);
  await ensureHousehold(signedIn.user.id);

  return { ok: true };
}
