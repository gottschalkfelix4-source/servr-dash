"use client";

import {
  Monitor,
  HardDrive,
  Clock,
  ArrowLeft,
  User,
  Server,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyDevices } from "@/hooks/useSynology";
import { getLogStatusLabel } from "@/types/synology";

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

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}

function getDeviceIcon(backupType: number) {
  switch (backupType) {
    case 1: return <Server size={18} />;
    case 2: return <Laptop size={18} />;
    case 3: return <Monitor size={18} />;
    default: return <Monitor size={18} />;
  }
}

function getStatusBadgeVariant(status?: number): "success" | "warning" | "danger" | "default" {
  if (!status) return "default";
  if (status === 2) return "success";
  if (status === 3) return "warning";
  if (status === 4) return "danger";
  return "default";
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
          {devices.map((device) => (
            <Card key={device.device_id}>
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    device.is_online
                      ? "bg-accent-emerald/10 text-accent-emerald"
                      : "bg-white/[0.04] text-muted"
                  }`}
                >
                  {getDeviceIcon(device.backup_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={device.is_online ? "online" : "offline"} />
                    <h3 className="text-sm font-medium truncate">
                      {device.device_name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {device.ip_addr} · {device.os_name}
                  </p>
                </div>
                <Badge variant={device.is_online ? "success" : "default"}>
                  {device.backup_type_label}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} /> Letztes Backup
                  </span>
                  <span className="text-foreground">
                    {device.last_backup_time
                      ? `${formatTimestamp(device.last_backup_time)} (${timeAgo(device.last_backup_time)})`
                      : "–"}
                  </span>
                </div>
                {device.last_backup_status && (
                  <div className="flex justify-between text-muted">
                    <span>Letzter Status</span>
                    <Badge variant={getStatusBadgeVariant(device.last_backup_status)}>
                      {getLogStatusLabel(device.last_backup_status)}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <User size={11} /> Benutzer
                  </span>
                  <span className="text-foreground">{device.login_user}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <HardDrive size={11} /> Tasks
                  </span>
                  <span className="text-foreground">{device.task_count}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
