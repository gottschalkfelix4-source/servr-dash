import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term") || "";

  if (!term) {
    return NextResponse.json(
      { error: "Parameter 'term' is required" },
      { status: 400 }
    );
  }

  try {
    const results = await radarrClient.lookupMovie(term);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
