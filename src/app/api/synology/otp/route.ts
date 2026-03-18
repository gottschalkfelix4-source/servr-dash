import { NextResponse } from "next/server";
import { synologyClient } from "@/lib/synology/client";

export const dynamic = "force-dynamic";

// POST: Submit OTP code for 2FA login
export async function POST(request: Request) {
  try {
    const { otpCode } = await request.json();

    if (!otpCode || typeof otpCode !== "string") {
      return NextResponse.json(
        { error: "OTP Code erforderlich" },
        { status: 400 }
      );
    }

    const result = await synologyClient.loginWithOtp(otpCode.trim());
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OTP Fehler" },
      { status: 500 }
    );
  }
}
