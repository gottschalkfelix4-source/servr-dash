"use client";

import { use } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CpuChart } from "@/components/charts/CpuChart";
import { RamChart } from "@/components/charts/RamChart";
import { NetworkChart } from "@/components/charts/NetworkChart";
import { DiskUsageBar } from "@/components/charts/DiskUsageBar";
import { ProcessTable } from "@/components/server/ProcessTable";
import { OsInfoCard } from "@/components/server/OsInfoCard";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useServerMetrics,
  useServerHistory,
  useServerProcesses,
} from "@/hooks/useMetrics";
import { formatBytes, formatPercent } from "@/lib/utils";
import { Cpu, MemoryStick, HardDrive, Network, Activity } from "lucide-react";

export default function ServerDetailPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = use(params);
  const { data: metricsData, error: metricsError } =
    useServerMetrics(serverId);
  const { data: historyData } = useServerHistory(serverId);
  const { data: processData } = useServerProcesses(serverId);

  const metrics = metricsData?.metrics;
  const history = historyData?.history || [];
  const processes = processData?.processes || [];

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
          <Badge variant="success">
            <StatusDot status="online" className="mr-1.5" />
            Online
          </Badge>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU Auslastung</CardTitle>
            <Cpu size={16} className="text-accent-cyan" />
          </CardHeader>
          <CpuChart data={history} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RAM Auslastung</CardTitle>
            <MemoryStick size={16} className="text-accent-purple" />
          </CardHeader>
          <RamChart data={history} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Netzwerk Traffic</CardTitle>
            <Network size={16} className="text-accent-emerald" />
          </CardHeader>
          <NetworkChart data={history} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Festplatten</CardTitle>
            <HardDrive size={16} className="text-accent-amber" />
          </CardHeader>
          <DiskUsageBar disks={metrics.disk} />
        </Card>
      </div>

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
