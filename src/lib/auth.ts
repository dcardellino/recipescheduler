import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";
import { ensureHousehold } from "@/actions/household";

export const auth = betterAuth({
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
