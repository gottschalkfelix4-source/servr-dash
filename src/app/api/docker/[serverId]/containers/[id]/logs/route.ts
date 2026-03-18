import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getDockerClient } from "@/lib/docker/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string; id: string }> }
) {
  const { serverId, id } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const tail = parseInt(url.searchParams.get("tail") || "200");

  try {
    const client = getDockerClient(server);
    const logs = await client.containerLogs(id, tail);
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Docker error" },
      { status: 503 }
    );
  }
}
