"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  Laptop,
  Server,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyLogs } from "@/hooks/useSynology";

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

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "–";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function getStatusIcon(status: number) {
  switch (status) {
    case 2: return { Icon: CheckCircle2, color: "text-accent-emerald", bg: "bg-accent-emerald/10" };
    case 3: return { Icon: AlertTriangle, color: "text-accent-amber", bg: "bg-accent-amber/10" };
    case 4: return { Icon: XCircle, color: "text-accent-red", bg: "bg-accent-red/10" };
    case 5: return { Icon: XCircle, color: "text-muted", bg: "bg-white/[0.04]" };
    default: return { Icon: Clock, color: "text-accent-cyan", bg: "bg-accent-cyan/10" };
  }
}

function getTypeIcon(type: number) {
  switch (type) {
    case 1: return <Server size={10} />;
    case 2: return <Laptop size={10} />;
    case 3: return <Monitor size={10} />;
    default: return null;
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
                {dateLogs!.map((log) => {
                  const { Icon, color, bg } = getStatusIcon(log.status);

                  return (
                    <div
                      key={log.result_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon size={16} className={color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {log.device_name}
                          </span>
                          <Badge variant={log.status === 2 ? "success" : log.status === 4 ? "danger" : "warning"}>
                            {log.status_label}
                          </Badge>
                          <Badge variant="default">
                            {log.backup_type_label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted">
                          <span>
                            {formatTimestamp(log.time_start)} → {formatTimestamp(log.time_end)}
                          </span>
                          <span>
                            Dauer: {formatDuration(log.duration_seconds)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            {getTypeIcon(log.backup_type)}
                            {log.task_name}
                          </span>
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
