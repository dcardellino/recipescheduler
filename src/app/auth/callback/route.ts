import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/actions/profile";
import { ensureHousehold } from "@/actions/household";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Magic-link / OTP redirect target. Handles both the PKCE `code` flow and the
 * `token_hash` verification flow, then provisions the user's profile and solo
 * household on first sign-in.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/recipes";

  const supabase = await createSupabaseServerClient();

  let authUser = null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authUser = data.user;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) authUser = data.user;
  }

  const base = getSiteUrl();
  if (!authUser) {
    return NextResponse.redirect(`${base}/login?error=auth`);
  }

  await ensureProfile(authUser);
  await ensureHousehold(authUser.id);

  return NextResponse.redirect(`${base}${next}`);
}
