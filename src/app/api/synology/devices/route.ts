import { NextResponse } from "next/server";
import { synologyClient } from "@/lib/synology/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const devices = await synologyClient.getDevices();
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
