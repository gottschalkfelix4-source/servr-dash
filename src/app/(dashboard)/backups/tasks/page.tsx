"use client";

import { ListChecks, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSynologyTasks } from "@/hooks/useSynology";

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

function getTaskStatusBadge(status: number) {
  switch (status) {
    case 1:
      return <Badge variant="success">Aktiv</Badge>;
    case 2:
      return <Badge variant="info">Läuft</Badge>;
    case 3:
      return <Badge variant="default">Pausiert</Badge>;
    default:
      return <Badge variant="default">Inaktiv</Badge>;
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
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent-purple/10 flex items-center justify-center shrink-0">
                  <ListChecks size={18} className="text-accent-purple" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium truncate">
                      {task.task_name}
                    </h3>
                    {getTaskStatusBadge(task.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {task.device_name && (
                      <span>Gerät: {task.device_name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      Letztes: {formatTimestamp(task.last_backup_time)}
                    </span>
                    {task.next_backup_time && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Nächstes: {formatTimestamp(task.next_backup_time)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
