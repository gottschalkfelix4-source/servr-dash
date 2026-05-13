import { NextResponse } from "next/server";
import { plexClient } from "@/lib/plex/client";

export async function GET() {
  const status = await plexClient.getStatus();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
