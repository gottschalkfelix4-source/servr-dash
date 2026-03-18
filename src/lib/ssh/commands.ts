import type {
  RamMetrics,
  DiskMetrics,
  NetworkMetrics,
  OsInfo,
  ProcessInfo,
} from "@/types/server";

// CPU usage from /proc/stat - requires two samples
export function parseCpuUsage(sample1: string, sample2: string): number {
  const parse = (line: string) => {
    const parts = line.trim().split(/\s+/).slice(1).map(Number);
    const idle = parts[3] + (parts[4] || 0); // idle + iowait
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total };
  };

  const s1Line = sample1.split("\n").find((l) => l.startsWith("cpu "));
  const s2Line = sample2.split("\n").find((l) => l.startsWith("cpu "));
  if (!s1Line || !s2Line) return 0;

  const s1 = parse(s1Line);
  const s2 = parse(s2Line);

  const totalDelta = s2.total - s1.total;
  const idleDelta = s2.idle - s1.idle;

  if (totalDelta === 0) return 0;
  return Math.round(((totalDelta - idleDelta) / totalDelta) * 1000) / 10;
}

// RAM from `free -b`
export function parseRam(output: string): RamMetrics {
  const line = output.split("\n").find((l) => l.startsWith("Mem:"));
  if (!line) return { total: 0, used: 0, available: 0, percent: 0 };

  const parts = line.trim().split(/\s+/).map(Number);
  const total = parts[1];
  const used = parts[2];
  const available = parts[6] || total - used;

  return {
    total,
    used,
    available,
    percent: total > 0 ? Math.round(((total - available) / total) * 1000) / 10 : 0,
  };
}

// Disk from `df -B1`
export function parseDisk(output: string): DiskMetrics[] {
  return output
    .split("\n")
    .slice(1)
    .filter((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 6) return false;
      // Filter real filesystems
      return (
        parts[0].startsWith("/") &&
        !parts[5]?.startsWith("/snap") &&
        !parts[5]?.startsWith("/boot/efi")
      );
    })
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        filesystem: parts[0],
        total: parseInt(parts[1]) || 0,
        used: parseInt(parts[2]) || 0,
        available: parseInt(parts[3]) || 0,
        percent: parseInt(parts[4]) || 0,
        mount: parts[5],
      };
    });
}

// Network interfaces from /proc/net/dev
export interface NetworkSnapshot {
  interface: string;
  rxBytes: number;
  txBytes: number;
}

export function parseNetworkSnapshot(output: string): NetworkSnapshot[] {
  return output
    .split("\n")
    .slice(2) // skip header lines
    .filter((line) => line.includes(":"))
    .map((line) => {
      const [name, rest] = line.split(":");
      const parts = rest.trim().split(/\s+/).map(Number);
      return {
        interface: name.trim(),
        rxBytes: parts[0],
        txBytes: parts[8],
      };
    })
    .filter((iface) => iface.interface !== "lo");
}

export function calculateNetworkRate(
  prev: NetworkSnapshot[],
  curr: NetworkSnapshot[],
  intervalSec: number
): NetworkMetrics[] {
  return curr
    .map((c) => {
      const p = prev.find((p) => p.interface === c.interface);
      if (!p) return null;
      return {
        interface: c.interface,
        rxBytesPerSec: Math.max(0, (c.rxBytes - p.rxBytes) / intervalSec),
        txBytesPerSec: Math.max(0, (c.txBytes - p.txBytes) / intervalSec),
      };
    })
    .filter((m): m is NetworkMetrics => m !== null);
}

// Processes from `ps aux`
export function parseProcesses(output: string): ProcessInfo[] {
  return output
    .split("\n")
    .slice(1) // skip header
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0],
        pid: parseInt(parts[1]) || 0,
        cpu: parseFloat(parts[2]) || 0,
        mem: parseFloat(parts[3]) || 0,
        command: parts.slice(10).join(" "),
      };
    })
    .filter((p) => p.pid > 0);
}

// Uptime from /proc/uptime
export function parseUptime(output: string): number {
  return parseFloat(output.trim().split(" ")[0]) || 0;
}

// OS info
export function parseOsInfo(output: string): OsInfo {
  const lines = output.split("\n");
  let name = "Linux";
  let kernel = "";
  let arch = "";
  let hostname = "";

  for (const line of lines) {
    if (line.startsWith("PRETTY_NAME=")) {
      name = line.split("=")[1]?.replace(/"/g, "") || name;
    }
  }

  // Last 3 lines are kernel, arch, hostname
  const lastLines = lines.filter((l) => l.trim() && !l.includes("="));
  if (lastLines.length >= 3) {
    kernel = lastLines[lastLines.length - 3];
    arch = lastLines[lastLines.length - 2];
    hostname = lastLines[lastLines.length - 1];
  }

  return { name, kernel, arch, hostname };
}

// SSH commands to execute
export const SSH_COMMANDS = {
  cpuSample: "cat /proc/stat | head -1",
  ram: "free -b",
  disk: "df -B1",
  network: "cat /proc/net/dev",
  processes: "ps aux --sort=-%cpu | head -26",
  uptime: "cat /proc/uptime",
  osInfo: "cat /etc/os-release 2>/dev/null; echo '---'; uname -r; uname -m; hostname",
} as const;
