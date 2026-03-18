import { NextResponse } from "next/server";
import { sonarrClient } from "@/lib/sonarr/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");
    const queue = await sonarrClient.getQueue(page, pageSize);
    return NextResponse.json(queue);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    const removeFromClient = url.searchParams.get("removeFromClient") !== "false";
    const blocklist = url.searchParams.get("blocklist") === "true";
    await sonarrClient.deleteQueueItem(id, removeFromClient, blocklist);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sonarr error" },
      { status: 500 }
    );
  }
}
