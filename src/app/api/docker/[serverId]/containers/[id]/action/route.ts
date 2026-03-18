import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getDockerClient } from "@/lib/docker/client";
import type { DockerAction } from "@/types/docker";

const VALID_ACTIONS: DockerAction[] = ["start", "stop", "restart", "remove"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string; id: string }> }
) {
  const { serverId, id } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const body = await request.json();
  const action = body.action as DockerAction;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Valid: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const client = getDockerClient(server);
    const result = await client.containerAction(id, action);
    return NextResponse.json({ success: true, result: result.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Docker error" },
      { status: 503 }
    );
  }
}
