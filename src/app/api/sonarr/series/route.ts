import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET() {
  try {
    const series = await sonarrClient.getSeries();
    return NextResponse.json(series);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await sonarrClient.addSeries(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}
