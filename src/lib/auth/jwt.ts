import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/types/auth";

// Lazy initialization — only runs at runtime, not during build
let _encodedKey: Uint8Array | null = null;

function getEncodedKey(): Uint8Array {
  if (_encodedKey) return _encodedKey;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "servr-dash-default-secret-change-me") {
    console.error(
      "\n[SECURITY] AUTH_SECRET is not set or uses the default value!\n" +
      "Generate a secure secret: openssl rand -base64 32\n" +
      "Set it in your environment or docker-compose.yml\n"
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production");
    }
  }

  _encodedKey = new TextEncoder().encode(secret || "dev-only-insecure-secret");
  return _encodedKey;
}

const EXPIRATION = "7d";

export function getJwtKey(): Uint8Array {
  return getEncodedKey();
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getEncodedKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey());
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      role: payload.role as "admin" | "user",
    };
  } catch {
    return null;
  }
}
