import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM ?? "RecipeScheduler <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

// Note: the passwordless sign-in ("magic link") email is sent by Supabase Auth
// (configure Custom SMTP → Resend in the Supabase dashboard). This module only
// sends app-generated household invite emails.

export async function sendHouseholdInviteEmail(
  email: string,
  inviterName: string,
  householdName: string,
  url: string,
) {
  if (!resend) {
    console.log(
      `\n[invite] → ${email}\n[invite] (from ${inviterName} for "${householdName}")\n[invite] ${url}\n`,
    );
    return;
  }
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `${inviterName} hat dich zu "${householdName}" eingeladen`,
    html: `
      <p>${inviterName} hat dich zu <strong>${householdName}</strong> in RecipeScheduler eingeladen.</p>
      <p>Klick hier, um beizutreten: <a href="${url}">${url}</a></p>
    `,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
