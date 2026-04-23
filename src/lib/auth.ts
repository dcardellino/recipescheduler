import "server-only";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";
import { verifyInviteToken, JoseErrors } from "@/lib/invite-token";
import { ensureHousehold } from "@/actions/household";

export const auth = betterAuth({
  logger: {
    level: "debug",
    verboseLogging: true,
  },
  // Validated at runtime by better-auth. A missing secret will fail the first
  // auth request with a clear error rather than blocking `next build`.
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async ({ email, url }) => {
        const existingUser = await db.query.user.findFirst({
          where: eq(schema.user.email, email.toLowerCase()),
          columns: { id: true },
        });

        if (!existingUser) {
          // New user: only allow via a valid invite link.
          const callbackURL = new URL(url).searchParams.get("callbackURL") ?? "";
          const inviteToken = new URLSearchParams(callbackURL.split("?")[1] ?? "").get("token");

          if (!inviteToken) {
            throw new Error("Registration is invite-only.");
          }

          try {
            const payload = await verifyInviteToken(inviteToken);
            if (payload.email.toLowerCase() !== email.toLowerCase()) {
              throw new Error("Invite token email mismatch.");
            }
          } catch (err) {
            if (err instanceof JoseErrors.JWTExpired) {
              throw new Error("The invite link has expired.");
            }
            throw new Error("Invalid invite token.");
          }
        }

        await sendMagicLinkEmail(email, url);
      },
    }),
    nextCookies(),
  ],
  databaseHooks: {
    session: {
      create: {
        after: async (createdSession) => {
          // Auto-provision a household for new users on their first session.
          await ensureHousehold(createdSession.userId);
        },
      },
    },
  },
});
