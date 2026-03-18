"use client";

import { use } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { ContainerLogs } from "@/components/docker/ContainerLogs";
import { PageHeader } from "@/components/layout/PageHeader";
import { useContainerInspect, useContainerLogs } from "@/hooks/useDocker";
import { Play, Square, RotateCw, Trash2 } from "lucide-react";
import { performContainerAction } from "@/hooks/useDocker";

export default function ContainerDetailPage({
  params,
}: {
  params: Promise<{ serverId: string; containerId: string }>;
}) {
  const { serverId, containerId } = use(params);
  const { data: inspectData, mutate: mutateInspect } = useContainerInspect(
    serverId,
    containerId
  );
  const { data: logsData } = useContainerLogs(serverId, containerId);

  const container = inspectData?.container;
  const logs = logsData?.logs || "";

  const handleAction = async (action: string) => {
    if (action === "remove" && !confirm("Container wirklich entfernen?")) return;
    await performContainerAction(serverId, containerId, action);
    setTimeout(() => mutateInspect(), 500);
  };

  if (!container) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const isRunning = container.state.running;

  return (
    <div>
      <PageHeader
        title={container.name}
        description={container.image}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? "success" : "danger"}>
              <StatusDot
                status={isRunning ? "online" : "offline"}
                className="mr-1.5"
              />
              {container.state.status}
            </Badge>
            <div className="flex items-center gap-1 ml-2">
              {!isRunning && (
                <button
                  onClick={() => handleAction("start")}
                  className="p-2 rounded-lg hover:bg-accent-emerald/20 text-accent-emerald transition-colors"
                  title="Starten"
                >
                  <Play size={16} />
                </button>
              )}
              {isRunning && (
                <button
                  onClick={() => handleAction("stop")}
                  className="p-2 rounded-lg hover:bg-accent-amber/20 text-accent-amber transition-colors"
                  title="Stoppen"
                >
                  <Square size={16} />
                </button>
              )}
              <button
                onClick={() => handleAction("restart")}
                className="p-2 rounded-lg hover:bg-accent-cyan/20 text-accent-cyan transition-colors"
                title="Neustarten"
              >
                <RotateCw size={16} />
              </button>
              <button
                onClick={() => handleAction("remove")}
                className="p-2 rounded-lg hover:bg-accent-red/20 text-accent-red transition-colors"
                title="Entfernen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Container Info */}
        <Card>
          <CardHeader>
            <CardTitle>Container Info</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            <InfoRow label="ID" value={container.id.substring(0, 12)} mono />
            <InfoRow label="Image" value={container.config.image} mono />
            <InfoRow label="Hostname" value={container.config.hostname} mono />
            <InfoRow label="Gestartet" value={container.state.startedAt} />
          </div>
        </Card>

        {/* Networks */}
        <Card>
          <CardHeader>
            <CardTitle>Netzwerke</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            {Object.entries(container.networkSettings.networks).map(
              ([name, net]) => (
                <div key={name}>
                  <div className="font-medium text-accent-cyan">{name}</div>
                  <div className="text-xs text-muted mt-1">
                    IP: {net.ipAddress} · Gateway: {net.gateway}
                  </div>
                </div>
              )
            )}
            {Object.keys(container.networkSettings.networks).length === 0 && (
              <span className="text-muted">Keine Netzwerke</span>
            )}
          </div>
        </Card>

        {/* Mounts */}
        <Card>
          <CardHeader>
            <CardTitle>Volumes & Mounts</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {container.mounts.map((mount, i) => (
              <div
                key={i}
                className="text-xs font-mono bg-background rounded p-2"
              >
                <span className="text-muted">{mount.source}</span>
                <span className="text-accent-cyan mx-1">→</span>
                <span>{mount.destination}</span>
                <Badge variant={mount.rw ? "success" : "warning"} className="ml-2">
                  {mount.rw ? "rw" : "ro"}
                </Badge>
              </div>
            ))}
            {container.mounts.length === 0 && (
              <span className="text-sm text-muted">Keine Mounts</span>
            )}
          </div>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader>
            <CardTitle>Umgebungsvariablen</CardTitle>
          </CardHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {container.config.env.map((env, i) => {
              const [key, ...rest] = env.split("=");
              return (
                <div key={i} className="text-xs font-mono bg-background rounded p-1.5">
                  <span className="text-accent-amber">{key}</span>
                  <span className="text-muted">=</span>
                  <span className="text-foreground/70">{rest.join("=")}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <ContainerLogs logs={logs} />
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
