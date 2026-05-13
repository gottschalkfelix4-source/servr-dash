"use client";

import { use, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CpuChart } from "@/components/charts/CpuChart";
import { RamChart } from "@/components/charts/RamChart";
import { NetworkChart } from "@/components/charts/NetworkChart";
import { GpuChart } from "@/components/charts/GpuChart";
import { DiskUsageBar } from "@/components/charts/DiskUsageBar";
import { ProcessTable } from "@/components/server/ProcessTable";
import { OsInfoCard } from "@/components/server/OsInfoCard";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useServerMetrics,
  useServerHistory,
  useServerProcesses,
} from "@/hooks/useMetrics";
import {
  toTimestampedMetrics,
  useLiveNow,
  useSmoothServerMetrics,
} from "@/hooks/useSmoothServerMetrics";
import { formatBytes, formatPercent } from "@/lib/utils";
import { Cpu, MemoryStick, HardDrive, Network, Activity } from "lucide-react";
import type { MetricsRange } from "@/lib/metrics-archive";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
};

interface ServerListItem {
  id: string;
  metricsSource?: "ssh" | "local";
}

const historyRanges: { value: MetricsRange; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 Tage" },
];

const LIVE_WINDOW_MS = 180_000;

export default function ServerDetailPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = use(params);
  const [historyRange, setHistoryRange] = useState<MetricsRange>("live");
  const { data: serversData } = useSWR<{ servers: ServerListItem[] }>(
    "/api/servers",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      refreshInterval: 10000,
    }
  );
  const configuredServer = serversData?.servers.find(
    (server) => server.id === serverId
  );
  const isLocalLive = configuredServer?.metricsSource === "local";
  const isSmoothLive = isLocalLive && historyRange === "live";
  const liveNow = useLiveNow(isSmoothLive);
  const liveRefreshInterval = isLocalLive ? 1000 : 5000;
  const { data: metricsData, error: metricsError } =
    useServerMetrics(serverId, liveRefreshInterval);
  const { data: historyData } = useServerHistory(
    serverId,
    historyRange,
    historyRange === "live" ? liveRefreshInterval : undefined
  );
  const { data: processData } = useServerProcesses(serverId);

  const rawMetrics = metricsData?.metrics;
  const smoothMetrics = useSmoothServerMetrics(
    rawMetrics,
    isSmoothLive
  );
  const metrics = smoothMetrics;
  const history = historyData?.history || [];
  const chartHistory = useMemo(() => {
    if (!metrics || !isSmoothLive) return history;

    const livePoint = toTimestampedMetrics(metrics, liveNow);
    const historyWithoutCurrentPoint = history.filter(
      (point) =>
        point.timestamp < livePoint.timestamp - 50 &&
        point.timestamp >= liveNow - LIVE_WINDOW_MS
    );

    return [...historyWithoutCurrentPoint, livePoint].slice(-180);
  }, [history, isSmoothLive, liveNow, metrics]);
  const processes = processData?.processes || [];
  const primaryGpu = metrics?.gpus?.[0];

  if (metricsError) {
    return (
      <div>
        <PageHeader title={serverId} />
        <Card>
          <div className="text-center py-12">
            <StatusDot status="offline" className="mx-auto mb-4 h-4 w-4" />
            <h3 className="text-lg font-medium mb-2">Server nicht erreichbar</h3>
            <p className="text-sm text-muted">
              SSH-Verbindung fehlgeschlagen. Prüfe die Konfiguration.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div>
        <PageHeader title={serverId} />
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={metrics.os.hostname || serverId}
        description={`${metrics.os.name} · ${metrics.os.kernel}`}
        actions={
          <div className="flex items-center gap-2">
            {isLocalLive && <Badge variant="info">Lokal live</Badge>}
            <Badge variant="success">
              <StatusDot status="online" className="mr-1.5" />
              Online
            </Badge>
          </div>
        }
      />

      {/* Quick stats */}
      <div
        className={`grid grid-cols-2 ${
          primaryGpu ? "md:grid-cols-5" : "md:grid-cols-4"
        } gap-4 mb-6`}
      >
        <Card glow="cyan">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className="text-accent-cyan" />
            <span className="text-xs text-muted">CPU</span>
          </div>
          <div className="text-2xl font-bold">{formatPercent(metrics.cpu)}</div>
        </Card>
        <Card glow="purple">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick size={16} className="text-accent-purple" />
            <span className="text-xs text-muted">RAM</span>
          </div>
          <div className="text-2xl font-bold">
            {formatPercent(metrics.ram.percent)}
          </div>
          <div className="text-xs text-muted font-mono">
            {formatBytes(metrics.ram.used)} / {formatBytes(metrics.ram.total)}
          </div>
        </Card>
        <Card glow="amber">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive size={16} className="text-accent-amber" />
            <span className="text-xs text-muted">Disk</span>
          </div>
          <div className="text-2xl font-bold">
            {metrics.disk[0] ? formatPercent(metrics.disk[0].percent) : "—"}
          </div>
        </Card>
        <Card glow="emerald">
          <div className="flex items-center gap-2 mb-2">
            <Network size={16} className="text-accent-emerald" />
            <span className="text-xs text-muted">Netzwerk</span>
          </div>
          <div className="text-sm font-medium font-mono">
            ↓ {formatBytes(metrics.network[0]?.rxBytesPerSec || 0)}/s
          </div>
          <div className="text-sm font-medium font-mono">
            ↑ {formatBytes(metrics.network[0]?.txBytesPerSec || 0)}/s
          </div>
        </Card>
        {primaryGpu && (
          <Card glow="cyan">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} className="text-accent-cyan" />
              <span className="text-xs text-muted">GPU</span>
            </div>
            <div className="text-2xl font-bold">
              {formatPercent(primaryGpu.utilization)}
            </div>
            <ProgressBar
              value={primaryGpu.utilization}
              color="cyan"
              className="mt-2"
            />
            <div className="text-xs text-muted font-mono truncate">
              {primaryGpu.temperature ? `${primaryGpu.temperature}°C · ` : ""}
              {primaryGpu.frequencyMHz
                ? `${primaryGpu.frequencyMHz.toFixed(0)} MHz · `
                : ""}
              {primaryGpu.memoryTotal > 0
                ? `${formatBytes(primaryGpu.memoryUsed)} / ${formatBytes(
                    primaryGpu.memoryTotal
                  )}`
                : "Shared Memory"}
            </div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold">Verlauf</h2>
          <p className="text-xs text-muted">
            {chartHistory.length} aufgezeichnete Punkte
            {isSmoothLive
              ? " - kontinuierlicher Live-Modus"
              : ""}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-1">
          {historyRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setHistoryRange(range.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                historyRange === range.value
                  ? "bg-accent-cyan text-background"
                  : "text-muted hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU Auslastung</CardTitle>
            <Cpu size={16} className="text-accent-cyan" />
          </CardHeader>
          <CpuChart
            data={chartHistory}
            range={historyRange}
            liveNow={isSmoothLive ? liveNow : undefined}
            windowMs={LIVE_WINDOW_MS}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RAM Auslastung</CardTitle>
            <MemoryStick size={16} className="text-accent-purple" />
          </CardHeader>
          <RamChart
            data={chartHistory}
            range={historyRange}
            liveNow={isSmoothLive ? liveNow : undefined}
            windowMs={LIVE_WINDOW_MS}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Netzwerk Traffic</CardTitle>
            <Network size={16} className="text-accent-emerald" />
          </CardHeader>
          <NetworkChart
            data={chartHistory}
            range={historyRange}
            liveNow={isSmoothLive ? liveNow : undefined}
            windowMs={LIVE_WINDOW_MS}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Festplatten</CardTitle>
            <HardDrive size={16} className="text-accent-amber" />
          </CardHeader>
          <DiskUsageBar disks={metrics.disk} />
        </Card>
      </div>

      {(metrics.gpus?.length || 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>GPU Auslastung</CardTitle>
              <Cpu size={16} className="text-accent-cyan" />
            </CardHeader>
            <GpuChart
              data={chartHistory}
              range={historyRange}
              liveNow={isSmoothLive ? liveNow : undefined}
              windowMs={LIVE_WINDOW_MS}
            />
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Grafikkarten</CardTitle>
              <Cpu size={16} className="text-accent-cyan" />
            </CardHeader>
            <div className="space-y-4">
              {metrics.gpus.map((gpu) => (
                <div
                  key={gpu.id}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{gpu.name}</div>
                      <div className="text-xs text-muted uppercase">{gpu.vendor}</div>
                    </div>
                    <Badge variant="info">
                      {gpu.temperature ? `${gpu.temperature}°C` : "Aktiv"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted">Auslastung</span>
                        <span className="font-mono">
                          {formatPercent(gpu.utilization)}
                        </span>
                      </div>
                      <ProgressBar
                        value={gpu.utilization}
                        color="cyan"
                        showLabel
                      />
                    </div>
                    {gpu.memoryTotal > 0 ? (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">VRAM</span>
                          <span className="font-mono">
                            {formatBytes(gpu.memoryUsed)} /{" "}
                            {formatBytes(gpu.memoryTotal)}
                          </span>
                        </div>
                        <ProgressBar value={gpu.memoryPercent} color="purple" />
                      </div>
                    ) : (
                      <div className="text-xs text-muted">
                        Speicher:{" "}
                        <span className="font-mono text-foreground">
                          Shared Memory
                        </span>
                      </div>
                    )}
                    {gpu.powerDraw !== undefined && (
                      <div className="text-xs text-muted">
                        Leistungsaufnahme:{" "}
                        <span className="font-mono text-foreground">
                          {gpu.powerDraw.toFixed(1)} W
                        </span>
                      </div>
                    )}
                    {gpu.frequencyMHz !== undefined && (
                      <div className="text-xs text-muted">
                        Takt:{" "}
                        <span className="font-mono text-foreground">
                          {gpu.frequencyMHz.toFixed(0)} MHz
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* System Info + Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OsInfoCard os={metrics.os} uptime={metrics.uptime} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Prozesse (Top 25)</CardTitle>
            <Activity size={16} className="text-muted" />
          </CardHeader>
          <ProcessTable processes={processes} />
        </Card>
      </div>
    </div>
  );
}
