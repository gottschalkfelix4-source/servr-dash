import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const seriesId = Number(id);
  const url = new URL(request.url);
  const episodeId = url.searchParams.get("episodeId");

  try {
    const releases = await sonarrClient.getReleases(
      seriesId,
      episodeId ? Number(episodeId) : undefined
    );
    return NextResponse.json(releases);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { guid, indexerId } = await request.json();
    await sonarrClient.grabRelease(guid, indexerId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Grab failed" },
      { status: 500 }
    );
  }
}
