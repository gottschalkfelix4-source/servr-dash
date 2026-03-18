import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);

  try {
    const movie = await radarrClient.getMovie(movieId);
    return NextResponse.json(movie);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);

  try {
    const body = await request.json();
    const movie = await radarrClient.updateMovie(movieId, body);
    return NextResponse.json(movie);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movieId = Number(id);
  const { searchParams } = new URL(request.url);
  const deleteFiles = searchParams.get("deleteFiles") === "true";

  try {
    await radarrClient.deleteMovie(movieId, deleteFiles);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
