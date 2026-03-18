import { NextResponse } from "next/server";
import {
  createPlexPin,
  checkPlexPin,
  getPlexAuthUrl,
  getPlexServerUrl,
} from "@/lib/plex/auth";
import { savePlexToken, getPlexToken } from "@/lib/config";

// POST: Create a new PIN and return the auth URL
export async function POST() {
  try {
    const pin = await createPlexPin();
    const authUrl = getPlexAuthUrl(pin.code);

    return NextResponse.json({
      pinId: pin.id,
      code: pin.code,
      authUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create PIN" },
      { status: 500 }
    );
  }
}

// GET: Check PIN status or get current auth status
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pinId = url.searchParams.get("pinId");

  // If pinId provided, check PIN status
  if (pinId) {
    try {
      const pin = await checkPlexPin(parseInt(pinId));

      if (pin.authToken) {
        // Auth successful - save token and try to find server URL
        const serverUrl = await getPlexServerUrl(pin.authToken);
        savePlexToken(pin.authToken, serverUrl || undefined);

        return NextResponse.json({
          authenticated: true,
          serverUrl,
        });
      }

      return NextResponse.json({ authenticated: false });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to check PIN" },
        { status: 500 }
      );
    }
  }

  // No pinId - return current auth status
  const token = getPlexToken();
  return NextResponse.json({
    hasToken: !!token,
  });
}

// DELETE: Remove Plex token (logout)
export async function DELETE() {
  savePlexToken("");
  return NextResponse.json({ success: true });
}
