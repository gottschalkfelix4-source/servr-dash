import type {
  RamMetrics,
  DiskMetrics,
  NetworkMetrics,
  GpuMetrics,
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

export function parseGpuMetrics(output: string): GpuMetrics[] {
  const gpus: GpuMetrics[] = [];

  for (const line of output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)) {
    if (
      line === "INTEL_GPU_TOP_BEGIN" ||
      line === "INTEL_GPU_TOP_END" ||
      line.startsWith("{") ||
      line.startsWith("}")
    ) {
      continue;
    }

    const parts = line.split(",").map((part) => part.trim());
    const source = parts[0]?.toUpperCase();

    if (source === "NVIDIA" && parts.length >= 6) {
      const parsed = parseNvidiaGpu(parts.slice(1));
      if (parsed) gpus.push(parsed);
      continue;
    }

    if (source === "INTEL_SYSFS" && parts.length >= 2) {
      const id = parts[1] || "intel";
      if (!gpus.some((gpu) => gpu.vendor === "intel" && gpu.id === id)) {
        gpus.push({
          id,
          name: parts[2] && parts[2] !== "0x0000" ? `Intel iGPU ${parts[2]}` : "Intel iGPU",
          vendor: "intel",
          utilization: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          memoryPercent: 0,
          frequencyMHz: parseOptionalNumber(parts[3]),
        });
      }
      continue;
    }

    const parsed = parseNvidiaGpu(parts);
    if (parsed) gpus.push(parsed);
  }

  const intelTop = parseIntelGpuTop(output);
  if (intelTop) {
    const existing = gpus.find((gpu) => gpu.vendor === "intel");
    if (existing) {
      existing.utilization = intelTop.utilization;
      existing.powerDraw = intelTop.powerDraw;
      existing.frequencyMHz = intelTop.frequencyMHz ?? existing.frequencyMHz;
      existing.name = intelTop.name;
    } else {
      gpus.push(intelTop);
    }
  }

  return gpus;
}

function parseNvidiaGpu(parts: string[]): GpuMetrics | null {
  if (parts.length < 5) return null;

  const utilization = parseFloat(parts[2]) || 0;
  const memoryUsed = (parseFloat(parts[3]) || 0) * 1024 * 1024;
  const memoryTotal = (parseFloat(parts[4]) || 0) * 1024 * 1024;
  const temperature = parseOptionalNumber(parts[5]);
  const powerDraw = parseOptionalNumber(parts[6]);

  return {
    id: parts[0] || "0",
    name: parts[1] || "NVIDIA GPU",
    vendor: "nvidia",
    utilization,
    memoryUsed,
    memoryTotal,
    memoryPercent:
      memoryTotal > 0
        ? Math.round((memoryUsed / memoryTotal) * 1000) / 10
        : 0,
    temperature,
    powerDraw,
  };
}

function parseIntelGpuTop(output: string): GpuMetrics | null {
  const block = output.match(/INTEL_GPU_TOP_BEGIN\n?([\s\S]*?)INTEL_GPU_TOP_END/);
  if (!block) return null;

  const json = extractFirstJsonObject(block[1]);
  if (!json) return null;

  const engines = json.engines;
  const utilization =
    engines && typeof engines === "object"
      ? Math.min(
          100,
          Object.values(engines).reduce(
            (sum, engine) => sum + readMetric(engine, "busy"),
            0
          )
        )
      : 0;

  return {
    id: "intel",
    name: "Intel iGPU",
    vendor: "intel",
    utilization: Math.round(utilization * 10) / 10,
    memoryUsed: 0,
    memoryTotal: 0,
    memoryPercent: 0,
    powerDraw: readMetric(json.power, "GPU") || undefined,
    frequencyMHz:
      readMetric(json.frequency, "actual") ||
      readMetric(json.frequency, "requested") ||
      undefined,
  };
}

function extractFirstJsonObject(input: string): Record<string, unknown> | null {
  let start = -1;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          return JSON.parse(input.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function readMetric(source: unknown, key: string): number {
  if (!source || typeof source !== "object") return 0;
  const value = (source as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    const nested = (value as Record<string, unknown>).value;
    return typeof nested === "number" ? nested : 0;
  }
  return 0;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  const parsed = parseFloat(value || "");
  return Number.isFinite(parsed) ? parsed : undefined;
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
  gpu: `(${
    [
      "if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw --format=csv,noheader,nounits 2>/dev/null | sed 's/^/NVIDIA,/' ; fi",
      "if command -v intel_gpu_top >/dev/null 2>&1; then echo 'INTEL_GPU_TOP_BEGIN'; timeout 2s intel_gpu_top -J -s 1000 -o - 2>/dev/null || true; echo 'INTEL_GPU_TOP_END'; fi",
      "for card in /sys/class/drm/card[0-9]; do if [ -r \"$card/device/vendor\" ] && [ \"$(cat \"$card/device/vendor\")\" = \"0x8086\" ]; then device=$(cat \"$card/device/device\" 2>/dev/null || true); freq=$(cat \"$card/gt/gt0/rps_cur_freq_mhz\" 2>/dev/null || cat \"$card/gt_cur_freq_mhz\" 2>/dev/null || true); echo \"INTEL_SYSFS,$(basename \"$card\"),${device:-Intel iGPU},${freq:-}\"; fi; done",
      "true",
    ].join("; ")
  })`,
  processes: "ps aux --sort=-%cpu | head -26",
  uptime: "cat /proc/uptime",
  osInfo: "cat /etc/os-release 2>/dev/null; echo '---'; uname -r; uname -m; hostname",
} as const;
