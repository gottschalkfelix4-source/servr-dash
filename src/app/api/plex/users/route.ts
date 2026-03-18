import { NextResponse } from "next/server";
import { plexClient } from "@/lib/plex/client";

export async function GET() {
  try {
    const users = await plexClient.getUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Plex error", users: [] },
      { status: 502 }
    );
  }
}
