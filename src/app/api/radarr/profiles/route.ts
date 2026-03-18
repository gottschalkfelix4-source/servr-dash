import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET() {
  try {
    const profiles = await radarrClient.getQualityProfiles();
    return NextResponse.json(profiles);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
