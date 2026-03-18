import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);

  try {
    const releases = await radarrClient.getReleases(movieId);
    return NextResponse.json(releases);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { guid, indexerId } = await request.json();
    await radarrClient.grabRelease(guid, indexerId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Grab failed" },
      { status: 500 }
    );
  }
}
