import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM ?? "RecipeScheduler <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLinkEmail(email: string, url: string) {
  if (!resend) {
    // Dev fallback: log to server console so magic link works without Resend credentials.
    console.log(
      `\n[magic-link] → ${email}\n[magic-link] ${url}\n(no RESEND_API_KEY set — email transport stubbed; paste the URL above into your browser to sign in.)\n`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Dein Login-Link",
    html: `
      <p>Hallo,</p>
      <p>klick auf diesen Link, um dich in RecipeScheduler einzuloggen:</p>
      <p><a href="${url}">${url}</a></p>
      <p>Der Link ist 15 Minuten gültig. Wenn du die Anmeldung nicht angefordert hast, ignoriere diese Mail.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message ?? JSON.stringify(error)}`);
  }
}

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
