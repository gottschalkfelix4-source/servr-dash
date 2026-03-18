"use client";

import {
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyLogs } from "@/hooks/useSynology";
import { formatBytes } from "@/lib/utils";

function formatTimestamp(ts: number): string {
  if (!ts) return "–";
  return new Date(ts * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: number, end: number): string {
  if (!start || !end) return "–";
  const diff = end - start;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

function getStatusInfo(status: number) {
  switch (status) {
    case 1:
      return {
        label: "Erfolgreich",
        color: "success" as const,
        icon: CheckCircle2,
        iconColor: "text-accent-emerald",
      };
    case 2:
      return {
        label: "Warnung",
        color: "warning" as const,
        icon: AlertTriangle,
        iconColor: "text-accent-amber",
      };
    case 3:
      return {
        label: "Fehlgeschlagen",
        color: "danger" as const,
        icon: XCircle,
        iconColor: "text-accent-red",
      };
    case 4:
      return {
        label: "Abgebrochen",
        color: "default" as const,
        icon: XCircle,
        iconColor: "text-muted",
      };
    default:
      return {
        label: "Läuft",
        color: "info" as const,
        icon: Clock,
        iconColor: "text-accent-cyan",
      };
  }
}

export default function BackupLogsPage() {
  const { data: logs, isLoading } = useSynologyLogs(100);

  // Group by date
  const grouped = new Map<string, typeof logs>();
  if (logs) {
    for (const log of logs) {
      const dateKey = new Date(log.time_end * 1000).toLocaleDateString(
        "de-DE",
        { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
      );
      const existing = grouped.get(dateKey) || [];
      existing.push(log);
      grouped.set(dateKey, existing);
    }
  }

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
        title="Backup-Verlauf"
        description="Letzte Backup-Ergebnisse"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-sm text-muted">
            Kein Backup-Verlauf vorhanden
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([date, dateLogs]) => (
            <div key={date}>
              <h3 className="text-xs font-medium text-muted mb-3">{date}</h3>
              <div className="space-y-2">
                {dateLogs!.map((log, i) => {
                  const info = getStatusInfo(log.status);
                  const Icon = info.icon;

                  return (
                    <div
                      key={log.log_id || i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          info.color === "success"
                            ? "bg-accent-emerald/10"
                            : info.color === "danger"
                              ? "bg-accent-red/10"
                              : info.color === "warning"
                                ? "bg-accent-amber/10"
                                : "bg-white/[0.04]"
                        }`}
                      >
                        <Icon size={16} className={info.iconColor} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {log.device_name ||
                              log.task_name ||
                              `Task ${log.task_id}`}
                          </span>
                          <Badge variant={info.color}>{info.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted">
                          <span>
                            {formatTimestamp(log.time_start)} →{" "}
                            {formatTimestamp(log.time_end)}
                          </span>
                          <span>
                            Dauer: {formatDuration(log.time_start, log.time_end)}
                          </span>
                          {log.transferred_bytes != null &&
                            log.transferred_bytes > 0 && (
                              <span>
                                Übertragen: {formatBytes(log.transferred_bytes)}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
