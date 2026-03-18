import { NextResponse } from "next/server";
import { synologyClient } from "@/lib/synology/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await synologyClient.getOverview();
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch overview" },
      { status: 500 }
    );
  }
}
