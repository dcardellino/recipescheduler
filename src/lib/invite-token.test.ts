import { describe, it, expect, beforeEach } from "vitest";

// Set secret before importing so server-only env check passes
beforeEach(() => {
  process.env.INVITE_TOKEN_SECRET = "test-secret-for-invite-token-tests-32chars";
});

// Dynamic import to avoid server-only check at module evaluation time
async function getModule() {
  const mod = await import("./invite-token");
  return mod;
}

describe("invite-token", () => {
  it("round-trips a valid payload", async () => {
    const { signInviteToken, verifyInviteToken } = await getModule();
    const payload = { email: "user@example.com", hid: "household-uuid-123" };
    const token = await signInviteToken(payload);
    const result = await verifyInviteToken(token);
    expect(result.email).toBe(payload.email);
    expect(result.hid).toBe(payload.hid);
  });

  it("rejects a tampered token", async () => {
    const { signInviteToken, verifyInviteToken, JoseErrors } =
      await getModule();
    const token = await signInviteToken({
      email: "user@example.com",
      hid: "abc",
    });
    // Corrupt the signature (last char)
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    await expect(verifyInviteToken(tampered)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const { JoseErrors } = await getModule();
    const { SignJWT } = await import("jose");
    const key = new TextEncoder().encode(
      process.env.INVITE_TOKEN_SECRET!,
    );
    const expiredToken = await new SignJWT({ email: "a@b.com", hid: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(key);

    const { verifyInviteToken } = await getModule();
    await expect(verifyInviteToken(expiredToken)).rejects.toBeInstanceOf(
      JoseErrors.JWTExpired,
    );
  });
});
