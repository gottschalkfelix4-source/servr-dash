import { NextResponse } from "next/server";
import { synologyClient } from "@/lib/synology/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await synologyClient.getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
