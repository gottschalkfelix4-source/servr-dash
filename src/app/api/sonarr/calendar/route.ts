import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start") || new Date().toISOString();
    const end =
      url.searchParams.get("end") ||
      new Date(Date.now() + 14 * 86400000).toISOString();
    const calendar = await sonarrClient.getCalendar(start, end);
    return NextResponse.json(calendar);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}
