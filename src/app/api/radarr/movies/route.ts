import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET() {
  try {
    const movies = await radarrClient.getMovies();
    return NextResponse.json(movies);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const movie = await radarrClient.addMovie(body);
    return NextResponse.json(movie, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
