import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") || new Date().toISOString();
  const end =
    searchParams.get("end") ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const calendar = await radarrClient.getCalendar(start, end);
    return NextResponse.json(calendar);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
