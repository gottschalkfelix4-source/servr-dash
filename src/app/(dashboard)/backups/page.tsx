"use client";

import Link from "next/link";
import {
  Shield,
  Monitor,
  ListChecks,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyOverview, useSynologyLogs } from "@/hooks/useSynology";
function formatTimestamp(ts: number): string {
  if (!ts) return "–";
  return new Date(ts * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusInfo(status: number) {
  switch (status) {
    case 2:
      return { label: "Erfolgreich", color: "success" as const, icon: CheckCircle2 };
    case 3:
      return { label: "Warnung", color: "warning" as const, icon: AlertTriangle };
    case 4:
      return { label: "Fehlgeschlagen", color: "danger" as const, icon: XCircle };
    case 5:
      return { label: "Abgebrochen", color: "default" as const, icon: XCircle };
    default:
      return { label: "Läuft", color: "info" as const, icon: Clock };
  }
}

export default function BackupsPage() {
  const { data: overview, isLoading: overviewLoading } = useSynologyOverview();
  const { data: logs } = useSynologyLogs(10);

  return (
    <div>
      <PageHeader
        title="Backups"
        description="Synology Active Backup for Business"
      />

      {overviewLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !overview ? (
        <Card>
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Synology nicht konfiguriert
            </h3>
            <p className="text-sm text-muted mb-4">
              Konfiguriere die Synology Verbindung in den Einstellungen.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
            >
              Zu den Einstellungen
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Geräte"
              value={overview.total_devices}
              sub={`${overview.online_devices} online`}
              icon={<Monitor size={18} />}
              color="cyan"
            />
            <StatCard
              label="Tasks"
              value={overview.total_tasks}
              sub={`${overview.scheduled_tasks} geplant`}
              icon={<ListChecks size={18} />}
              color="purple"
            />
            <StatCard
              label="Letzte 24h"
              value={overview.last_24h_backups}
              sub={`${overview.success_count} ✓ · ${overview.error_count} ✗`}
              icon={<Clock size={18} />}
              color={overview.error_count > 0 ? "red" : "emerald"}
            />
            <StatCard
              label="Geplant"
              value={overview.scheduled_tasks}
              sub={`von ${overview.total_tasks} Tasks`}
              icon={<HardDrive size={18} />}
              color="amber"
            />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <QuickLink
              href="/backups/devices"
              icon={<Monitor size={20} />}
              label="Geräte"
              description={`${overview.total_devices} Geräte verwaltet`}
            />
            <QuickLink
              href="/backups/tasks"
              icon={<ListChecks size={20} />}
              label="Backup-Tasks"
              description={`${overview.total_tasks} Tasks konfiguriert`}
            />
            <QuickLink
              href="/backups/logs"
              icon={<ScrollText size={20} />}
              label="Backup-Verlauf"
              description="Letzte Backup-Ergebnisse"
            />
          </div>

          {/* Recent logs */}
          {logs && logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Letzte Backups</CardTitle>
                <Link
                  href="/backups/logs"
                  className="text-xs text-accent-cyan hover:underline"
                >
                  Alle anzeigen →
                </Link>
              </CardHeader>
              <div className="space-y-2">
                {logs.slice(0, 8).map((log, i) => {
                  const info = getStatusInfo(log.status);
                  const Icon = info.icon;
                  return (
                    <div
                      key={log.result_id || i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <Icon
                        size={16}
                        className={
                          info.color === "success"
                            ? "text-accent-emerald"
                            : info.color === "danger"
                              ? "text-accent-red"
                              : info.color === "warning"
                                ? "text-accent-amber"
                                : "text-muted"
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {log.device_name || log.task_name}
                        </span>
                        <span className="text-[10px] text-muted">
                          {formatTimestamp(log.time_end)}
                          {log.duration_seconds > 0
                            ? ` · ${Math.floor(log.duration_seconds / 60)}m`
                            : ""}
                        </span>
                      </div>
                      <Badge variant={info.color}>{info.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  isText?: boolean;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)]",
    purple: "text-accent-purple bg-accent-purple/10",
    emerald: "text-accent-emerald bg-accent-emerald/10",
    red: "text-accent-red bg-accent-red/10",
    amber: "text-accent-amber bg-accent-amber/10",
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.cyan}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className={`font-bold ${isText ? "text-lg" : "text-2xl"}`}>
            {value}
          </p>
          <p className="text-[10px] text-muted">{sub}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent-cyan/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="text-accent-cyan group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}
