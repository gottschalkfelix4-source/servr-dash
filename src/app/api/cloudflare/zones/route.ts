import { NextResponse } from "next/server";
import { cloudflareClient } from "@/lib/cloudflare/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zones = await cloudflareClient.getZones();
    return NextResponse.json(zones);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cloudflare error" },
      { status: 500 }
    );
  }
}
