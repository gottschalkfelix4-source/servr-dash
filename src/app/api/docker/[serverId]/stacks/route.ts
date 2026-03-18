import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getDockerClient } from "@/lib/docker/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    const client = getDockerClient(server);
    const stacks = await client.listStacks();
    return NextResponse.json({ stacks });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Docker error" },
      { status: 503 }
    );
  }
}
