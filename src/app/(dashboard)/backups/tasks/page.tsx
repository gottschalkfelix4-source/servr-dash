"use client";

import {
  ListChecks,
  Clock,
  ArrowLeft,
  Calendar,
  Server,
  Laptop,
  Monitor,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyTasks } from "@/hooks/useSynology";
import { getLogStatusLabel } from "@/types/synology";

function formatTimestamp(ts?: number): string {
  if (!ts || ts < 0) return "–";
  return new Date(ts * 1000).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeIcon(type: number) {
  switch (type) {
    case 1: return <Server size={18} className="text-accent-purple" />;
    case 2: return <Laptop size={18} className="text-accent-cyan" />;
    case 3: return <Monitor size={18} className="text-accent-emerald" />;
    default: return <ListChecks size={18} className="text-muted" />;
  }
}

export default function BackupTasksPage() {
  const { data: tasks, isLoading } = useSynologyTasks();

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
        title="Backup-Tasks"
        description="Konfigurierte Backup-Aufgaben"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-sm text-muted">
            Keine Backup-Tasks gefunden
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.task_id}>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  {getTypeIcon(task.backup_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate">
                      {task.task_name}
                    </h3>
                    <Badge variant="default">{task.backup_type_label}</Badge>
                    {task.is_scheduled ? (
                      <Badge variant="success">Geplant</Badge>
                    ) : (
                      <Badge variant="default">Manuell</Badge>
                    )}
                  </div>

                  {/* Devices */}
                  {task.device_names.length > 0 && (
                    <p className="text-xs text-muted mb-2">
                      Geräte: {task.device_names.join(", ")}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted flex items-center gap-1 mb-0.5">
                        <Calendar size={10} /> Zeitplan
                      </span>
                      <span className="text-foreground">{task.schedule_label}</span>
                    </div>
                    <div>
                      <span className="text-muted flex items-center gap-1 mb-0.5">
                        <Clock size={10} /> Nächstes Backup
                      </span>
                      <span className="text-foreground">
                        {formatTimestamp(task.next_trigger_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted flex items-center gap-1 mb-0.5">
                        <Clock size={10} /> Letztes Backup
                      </span>
                      <span className="text-foreground">
                        {formatTimestamp(task.last_backup_time)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted flex items-center gap-1 mb-0.5">
                        <HardDrive size={10} /> Aufbewahrung
                      </span>
                      <span className="text-foreground">
                        {task.retention_versions} Versionen
                      </span>
                    </div>
                  </div>

                  {/* Last backup status */}
                  {task.last_backup_status && (
                    <div className="mt-2">
                      <Badge
                        variant={
                          task.last_backup_status === 2
                            ? "success"
                            : task.last_backup_status === 3
                              ? "warning"
                              : task.last_backup_status === 4
                                ? "danger"
                                : "default"
                        }
                      >
                        Letztes Ergebnis: {getLogStatusLabel(task.last_backup_status)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
