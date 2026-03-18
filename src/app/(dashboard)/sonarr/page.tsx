"use client";

import Link from "next/link";
import {
  Tv,
  MonitorPlay,
  Clock,
  HardDrive,
  Download,
  Eye,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils";
import { useSonarrStatus, useSonarrSeries, useSonarrQueue } from "@/hooks/useSonarr";

export default function SonarrPage() {
  const { data: status, error: statusError } = useSonarrStatus();
  const { data: series } = useSonarrSeries();
  const { data: queueData } = useSonarrQueue();

  const allSeries = series || [];
  const monitored = allSeries.filter((s) => s.monitored).length;
  const continuing = allSeries.filter((s) => s.status === "continuing").length;
  const ended = allSeries.filter((s) => s.status === "ended").length;
  const totalEpisodes = allSeries.reduce(
    (sum, s) => sum + (s.statistics?.episodeCount ?? 0),
    0
  );
  const downloadedEpisodes = allSeries.reduce(
    (sum, s) => sum + (s.statistics?.episodeFileCount ?? 0),
    0
  );
  const totalSize = allSeries.reduce(
    (sum, s) => sum + (s.statistics?.sizeOnDisk ?? 0),
    0
  );
  const queueCount = queueData?.totalRecords ?? 0;

  if (!status && !statusError) {
    return (
      <div>
        <PageHeader title="Sonarr" description="TV-Serien Verwaltung" />
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div>
        <PageHeader title="Sonarr" description="TV-Serien Verwaltung" />
        <Card>
          <div className="text-center py-12">
            <Tv size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Sonarr nicht erreichbar
            </h3>
            <p className="text-sm text-muted">
              Prüfe die Sonarr-Konfiguration in den Einstellungen.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sonarr"
        description="TV-Serien Verwaltung"
        actions={
          <div className="flex gap-2">
            <Link
              href="/sonarr/series/add"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-colors"
            >
              Serie hinzufügen
            </Link>
          </div>
        }
      />

      {/* Status card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card glow="cyan">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <StatusDot status="online" />
          </CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Version</span>
              <span>{status?.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status</span>
              <Badge variant="success">Verbunden</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bibliothek</CardTitle>
            <Tv size={16} className="text-muted" />
          </CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Serien</span>
              <span className="font-bold">{allSeries.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Episoden</span>
              <span className="font-bold">
                {downloadedEpisodes}/{totalEpisodes}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Speicher</span>
              <span className="font-bold">{formatBytes(totalSize)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Downloads</CardTitle>
            <Download size={16} className="text-muted" />
          </CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">In Warteschlange</span>
            <span className="text-3xl font-bold">{queueCount}</span>
          </div>
        </Card>
      </div>

      {/* Quick stats grid */}
      <h3 className="text-sm font-medium text-muted mb-4">Übersicht</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            icon: Tv,
            label: "Serien",
            value: allSeries.length,
            href: "/sonarr/series",
          },
          {
            icon: Eye,
            label: "Überwacht",
            value: monitored,
            href: "/sonarr/series",
          },
          {
            icon: CheckCircle,
            label: "Beendet",
            value: ended,
            href: "/sonarr/series",
          },
          {
            icon: MonitorPlay,
            label: "Fortlaufend",
            value: continuing,
            href: "/sonarr/series",
          },
          {
            icon: HardDrive,
            label: "Episoden",
            value: `${downloadedEpisodes}/${totalEpisodes}`,
            href: "/sonarr/series",
          },
          {
            icon: Clock,
            label: "Warteschlange",
            value: queueCount,
            href: "/sonarr/queue",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover>
              <div className="flex flex-col items-center text-center gap-1">
                <stat.icon size={20} className="text-muted mb-1" />
                <span className="text-lg font-bold">{stat.value}</span>
                <span className="text-xs text-muted">{stat.label}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
