import { execServerCommand } from "@/lib/server-exec";
import {
  parseCpuUsage,
  parseRam,
  parseDisk,
  parseNetworkSnapshot,
  calculateNetworkRate,
  parseGpuMetrics,
  parseUptime,
  parseOsInfo,
  parseProcesses,
  SSH_COMMANDS,
  type NetworkSnapshot,
} from "./commands";
import type { ServerConfig, ServerMetrics, ProcessInfo } from "@/types/server";

// Store previous network snapshots for rate calculation
const prevNetworkSnapshots = new Map<string, { data: NetworkSnapshot[]; time: number }>();

// Cache OS info since it rarely changes (refresh every 5 minutes)
const osInfoCache = new Map<string, { data: ReturnType<typeof parseOsInfo>; time: number }>();
const OS_CACHE_TTL = 300_000; // 5 minutes

// Batched SSH command: runs all metrics collection in a single exec call
const BATCHED_METRICS_CMD = [
  "cat /proc/stat | head -1",
  "echo '___DELIM___'",
  "free -b",
  "echo '___DELIM___'",
  "df -B1",
  "echo '___DELIM___'",
  "cat /proc/net/dev",
  "echo '___DELIM___'",
  SSH_COMMANDS.gpu,
  "echo '___DELIM___'",
  "cat /proc/uptime",
  "echo '___DELIM___'",
  // Second CPU sample after a brief delay
  "sleep 0.5 && cat /proc/stat | head -1",
].join(" && ");

export async function collectMetrics(server: ServerConfig): Promise<ServerMetrics> {
  const exec = (cmd: string) => execServerCommand(server, cmd);

  // Single SSH exec for all metrics (instead of 7 separate calls)
  const batchedOutput = await exec(BATCHED_METRICS_CMD);
  const parts = batchedOutput.split("___DELIM___\n");

  const cpuSample1 = parts[0] || "";
  const ramOut = parts[1] || "";
  const diskOut = parts[2] || "";
  const networkOut = parts[3] || "";
  const gpuOut = parts[4] || "";
  const uptimeOut = parts[5] || "";
  const cpuSample2 = parts[6] || "";

  // Parse everything
  const cpu = parseCpuUsage(cpuSample1, cpuSample2);
  const ram = parseRam(ramOut);
  const disk = parseDisk(diskOut);
  const gpus = parseGpuMetrics(gpuOut);
  const uptime = parseUptime(uptimeOut);

  // OS info: use cache (rarely changes)
  const now = Date.now();
  let os = osInfoCache.get(server.id);
  if (!os || now - os.time > OS_CACHE_TTL) {
    const osOut = await exec(
      "cat /etc/os-release 2>/dev/null; echo '---'; uname -r; uname -m; hostname"
    );
    const osParts = osOut.split("---");
    const parsed = parseOsInfo(osParts[0] + "\n" + (osParts[1] || ""));
    os = { data: parsed, time: now };
    osInfoCache.set(server.id, os);
  }

  // Network rate calculation
  const currentSnapshot = parseNetworkSnapshot(networkOut);
  const prev = prevNetworkSnapshots.get(server.id);

  let network = currentSnapshot.map((iface) => ({
    interface: iface.interface,
    rxBytesPerSec: 0,
    txBytesPerSec: 0,
  }));

  if (prev) {
    const intervalSec = (now - prev.time) / 1000;
    if (intervalSec > 0) {
      network = calculateNetworkRate(prev.data, currentSnapshot, intervalSec);
    }
  }

  prevNetworkSnapshots.set(server.id, { data: currentSnapshot, time: now });

  return {
    cpu,
    ram,
    disk,
    network,
    gpus,
    uptime,
    os: os.data,
    timestamp: now,
  };
}

export async function collectProcesses(server: ServerConfig): Promise<ProcessInfo[]> {
  const output = await execServerCommand(
    server,
    "ps aux --sort=-%cpu | head -26"
  );
  return parseProcesses(output);
}
