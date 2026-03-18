import { NextResponse } from "next/server";
import { radarrClient } from "@/lib/radarr/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");

  try {
    const queue = await radarrClient.getQueue(page, pageSize);
    return NextResponse.json(queue);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const removeFromClient = searchParams.get("removeFromClient") !== "false";
  const blocklist = searchParams.get("blocklist") === "true";

  if (!id) {
    return NextResponse.json(
      { error: "Parameter 'id' is required" },
      { status: 400 }
    );
  }

  try {
    await radarrClient.deleteQueueItem(id, removeFromClient, blocklist);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Radarr error" },
      { status: 500 }
    );
  }
}
