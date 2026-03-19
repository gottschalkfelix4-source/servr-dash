import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types/auth";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "servr-dash-default-secret-change-me") {
    console.error(
      "\n[SECURITY] AUTH_SECRET is not set or uses the default value!\n" +
      "Generate a secure secret: openssl rand -base64 32\n" +
      "Set it in your environment or docker-compose.yml\n"
    );
    // In production, refuse to start with default secret
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production");
    }
  }
  return new TextEncoder().encode(secret || "dev-only-insecure-secret");
}

const ENCODED_KEY = getSecretKey();
const EXPIRATION = "7d";

export { ENCODED_KEY };

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
