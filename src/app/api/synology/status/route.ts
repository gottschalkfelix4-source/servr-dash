import { NextResponse } from "next/server";
import { synologyClient } from "@/lib/synology/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await synologyClient.testConnection();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check Synology status" },
      { status: 500 }
    );
  }
}
