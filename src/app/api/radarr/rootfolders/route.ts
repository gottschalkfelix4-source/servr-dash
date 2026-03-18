import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET() {
  try {
    const rootFolders = await radarrClient.getRootFolders();
    return NextResponse.json(rootFolders);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
