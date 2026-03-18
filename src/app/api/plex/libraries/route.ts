import { NextResponse } from "next/server";
import { plexClient } from "@/lib/plex/client";

export async function GET() {
  try {
    const libraries = await plexClient.getLibraries();
    return NextResponse.json({ libraries });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Plex error", libraries: [] },
      { status: 502 }
    );
  }
}
