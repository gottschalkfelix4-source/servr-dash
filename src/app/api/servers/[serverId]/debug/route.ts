import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { sshPool } from "@/lib/ssh/connection-pool";
import { execServerCommand, isLocalMetricsServer } from "@/lib/server-exec";

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

  const results: Record<string, string> = {};

  // Test each command individually
  const commands = {
    cpuStat: "cat /proc/stat | head -1",
    free: "free -b",
    disk: "df -B1 | head -5",
    network: "cat /proc/net/dev | head -5",
    uptime: "cat /proc/uptime",
    osRelease: "cat /etc/os-release 2>/dev/null | head -3",
    uname: "uname -r && uname -m && hostname",
  };

  for (const [name, cmd] of Object.entries(commands)) {
    try {
      results[name] = await execServerCommand(server, cmd);
    } catch (err) {
      results[name] = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Also test the batched command
  try {
    const batchCmd = [
      "cat /proc/stat | head -1",
      "echo '___DELIM___'",
      "free -b",
      "echo '___DELIM___'",
      "df -B1",
      "echo '___DELIM___'",
      "cat /proc/net/dev",
      "echo '___DELIM___'",
      "cat /proc/uptime",
      "echo '___DELIM___'",
      "sleep 0.5 && cat /proc/stat | head -1",
    ].join(" && ");
    results["batched"] = await execServerCommand(server, batchCmd);
  } catch (err) {
    results["batched"] = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json({
    server: { id: server.id, name: server.name, host: server.host },
    connectionStatus: isLocalMetricsServer(server)
      ? { connected: true, mode: "local" }
      : sshPool.getStatus(server.id),
    results,
  });
}
