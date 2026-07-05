import "server-only";
import { SignJWT, jwtVerify, errors as JoseErrors } from "jose";

const ALG = "HS256";

export type InviteTokenPayload = {
  email: string;
  hid: string;
};

function getKey(): Uint8Array {
  const secret = process.env.INVITE_TOKEN_SECRET;
  if (!secret) throw new Error("INVITE_TOKEN_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function signInviteToken(
  payload: InviteTokenPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, hid: payload.hid })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifyInviteToken(
  token: string,
): Promise<InviteTokenPayload> {
  const { payload } = await jwtVerify(token, getKey());
  const email = payload["email"];
  const hid = payload["hid"];
  if (typeof email !== "string" || typeof hid !== "string") {
    throw new Error("Invalid invite token payload");
  }
  return { email, hid };
}

export { JoseErrors };
