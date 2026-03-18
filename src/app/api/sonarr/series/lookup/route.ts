import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const term = url.searchParams.get("term") || "";
    const results = await sonarrClient.lookupSeries(term);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}
