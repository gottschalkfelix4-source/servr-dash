import { NextResponse } from "next/server";
import { plexClient } from "@/lib/plex/client";

export async function GET() {
  try {
    const sessions = await plexClient.getSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Plex error", sessions: [] },
      { status: 502 }
    );
  }
}
