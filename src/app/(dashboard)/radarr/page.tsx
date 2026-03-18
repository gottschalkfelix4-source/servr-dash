"use client";

import Link from "next/link";
import { Film, Download, Calendar, Library, Plus, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatBytes } from "@/lib/utils";
import { useRadarrStatus, useRadarrMovies, useRadarrQueue } from "@/hooks/useRadarr";

export default function RadarrPage() {
  const { data: status, error: statusError } = useRadarrStatus();
  const { data: movies } = useRadarrMovies();
  const { data: queueData } = useRadarrQueue();

  const isOnline = !!status && !statusError;
  const movieList = movies || [];
  const queueRecords = queueData?.records || [];

  const monitored = movieList.filter((m) => m.monitored).length;
  const unmonitored = movieList.filter((m) => !m.monitored).length;
  const missing = movieList.filter((m) => m.monitored && !m.hasFile).length;
  const totalSize = movieList.reduce((sum, m) => sum + m.sizeOnDisk, 0);

  if (!status && !statusError) {
    return (
      <div>
        <PageHeader title="Radarr" description="Film-Verwaltung" />
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (statusError || !isOnline) {
    return (
      <div>
        <PageHeader title="Radarr" description="Film-Verwaltung" />
        <Card>
          <div className="text-center py-12">
            <Film size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Radarr nicht erreichbar
            </h3>
            <p className="text-sm text-muted">
              Pr\üfe RADARR_URL und RADARR_API_KEY in der Konfiguration.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Radarr"
        description="Film-Verwaltung"
        actions={
          <Link
            href="/radarr/movies/add"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-colors shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)]"
          >
            <Plus size={16} />
            Film hinzuf\ügen
          </Link>
        }
      />

      {/* Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card glow="cyan">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <Badge variant="success">
              <StatusDot status="online" className="mr-1.5" />
              Verbunden
            </Badge>
          </CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Version</span>
              <span className="font-mono text-xs">{status.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Speicher belegt</span>
              <span>{formatBytes(totalSize)}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBlock label="Filme gesamt" value={movieList.length} icon={<Film size={18} className="text-accent-cyan" />} />
            <StatBlock label="\Überwacht" value={monitored} icon={<StatusDot status="online" />} />
            <StatBlock label="Nicht \überwacht" value={unmonitored} icon={<StatusDot status="unknown" />} />
            <StatBlock label="Fehlend" value={missing} icon={<AlertCircle size={18} className="text-accent-red" />} />
          </div>
        </Card>
      </div>

      {/* Queue summary */}
      {queueRecords.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Download-Queue</CardTitle>
            <Badge variant="info">{queueRecords.length} Aktiv</Badge>
          </CardHeader>
          <div className="space-y-2">
            {queueRecords.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm bg-white/[0.02] rounded-lg px-3 py-2"
              >
                <span className="truncate flex-1">
                  {item.movie?.title || item.title}
                </span>
                <Badge variant="warning">{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink href="/radarr/movies" icon={<Library size={20} />} label="Filme" description={`${movieList.length} Filme`} />
        <QuickLink href="/radarr/queue" icon={<Download size={20} />} label="Queue" description={`${queueRecords.length} Downloads`} />
        <QuickLink href="/radarr/calendar" icon={<Calendar size={20} />} label="Kalender" description="Kommende Filme" />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
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
    <Link href={href}>
      <Card hover>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-cyan/10 text-accent-cyan">
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-muted">{description}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
