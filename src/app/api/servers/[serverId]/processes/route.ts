import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { collectProcesses } from "@/lib/ssh/collect-metrics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  const config = getConfig();
  const server = config.servers.find((s) => s.id === serverId);

  if (!server) {
    return NextResponse.json(
      { error: "Server not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  try {
    const processes = await collectProcesses(server);
    return NextResponse.json({ processes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to collect processes", code: "SSH_ERROR" },
      { status: 503 }
    );
  }
}
