import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);

  try {
    const body = await request.json();
    const result = await radarrClient.command(body.name, movieId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
