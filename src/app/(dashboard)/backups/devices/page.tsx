"use client";

import {
  Monitor,
  Wifi,
  WifiOff,
  HardDrive,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyDevices } from "@/hooks/useSynology";
import { formatBytes } from "@/lib/utils";
import { DEVICE_STATUS, BACKUP_STATUS } from "@/types/synology";

function formatTimestamp(ts?: number): string {
  if (!ts) return "–";
  return new Date(ts * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BackupDevicesPage() {
  const { data: devices, isLoading } = useSynologyDevices();

  return (
    <div>
      <Link
        href="/backups"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zur Übersicht
      </Link>

      <PageHeader
        title="Backup-Geräte"
        description="Alle mit Active Backup verbundenen Geräte"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !devices || devices.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-sm text-muted">
            Keine Geräte gefunden
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isOnline = device.status === 1 || device.status === 2;
            const statusText =
              DEVICE_STATUS[device.status as keyof typeof DEVICE_STATUS] ||
              "Unbekannt";
            const lastBackupStatus = device.backup_status
              ? BACKUP_STATUS[
                  device.backup_status as keyof typeof BACKUP_STATUS
                ] || "–"
              : "–";

            return (
              <Card key={device.device_id}>
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isOnline
                        ? "bg-accent-emerald/10 text-accent-emerald"
                        : "bg-white/[0.04] text-muted"
                    }`}
                  >
                    <Monitor size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusDot
                        status={isOnline ? "online" : "offline"}
                      />
                      <h3 className="text-sm font-medium truncate">
                        {device.device_name || device.host_name}
                      </h3>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {device.ip_addr || "–"}
                      {device.os_name ? ` · ${device.os_name}` : ""}
                    </p>
                  </div>
                  <Badge variant={isOnline ? "success" : "default"}>
                    {statusText}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> Letztes Backup
                    </span>
                    <span className="text-foreground">
                      {formatTimestamp(device.last_backup_time)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> Nächstes Backup
                    </span>
                    <span className="text-foreground">
                      {formatTimestamp(device.next_backup_time)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <HardDrive size={11} /> Backup-Größe
                    </span>
                    <span className="text-foreground">
                      {device.total_backup_size
                        ? formatBytes(device.total_backup_size)
                        : "–"}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Letzter Status</span>
                    <span>{lastBackupStatus}</span>
                  </div>
                  {device.agent_version && (
                    <div className="flex justify-between text-muted">
                      <span>Agent</span>
                      <span className="text-foreground">
                        v{device.agent_version}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
