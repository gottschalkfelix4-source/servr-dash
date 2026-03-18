import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const episodes = await sonarrClient.getEpisodes(Number(id));
    return NextResponse.json(episodes);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}
