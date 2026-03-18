import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types/auth";

const SECRET_KEY = process.env.AUTH_SECRET || "servr-dash-default-secret-change-me";
const ENCODED_KEY = new TextEncoder().encode(SECRET_KEY);
const EXPIRATION = "7d";

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(ENCODED_KEY);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ENCODED_KEY);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      role: payload.role as "admin" | "user",
    };
  } catch {
    return null;
  }
}
