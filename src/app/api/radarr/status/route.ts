import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET() {
  try {
    const status = await radarrClient.getStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=5" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
