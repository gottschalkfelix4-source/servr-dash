import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";
import type { AppConfig } from "@/types/server";

export async function GET() {
  const config = getConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as AppConfig;
    saveConfig(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save config" },
      { status: 400 }
    );
  }
}
