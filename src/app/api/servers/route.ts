import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { pollingScheduler } from "@/lib/polling";
import { sshPool } from "@/lib/ssh/connection-pool";

export async function GET() {
  const config = getConfig();
  pollingScheduler.start();

  const servers = config.servers.map((s) => ({
    id: s.id,
    name: s.name,
    host: s.host,
    port: s.port,
    dockerEnabled: s.dockerEnabled ?? false,
    connected: sshPool.isConnected(s.id),
  }));

  return NextResponse.json({ servers });
}
