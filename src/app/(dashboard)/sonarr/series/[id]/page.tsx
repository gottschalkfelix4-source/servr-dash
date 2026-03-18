"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Tv,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  Calendar,
  Clock,
  HardDrive,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { SeasonPanel } from "@/components/sonarr/SeasonPanel";
import { ReleasesPanel } from "@/components/sonarr/ReleasesPanel";
import { EditSeriesPanel } from "@/components/sonarr/EditSeriesPanel";
import { formatBytes } from "@/lib/utils";
import {
  useSonarrSerie,
  useSonarrEpisodes,
  searchSeries,
  refreshSeries,
  deleteSeries,
} from "@/hooks/useSonarr";
import Link from "next/link";

function getPosterUrl(
  images: { coverType: string; remoteUrl: string }[]
): string | null {
  const poster = images?.find((img) => img.coverType === "poster");
  return poster?.remoteUrl || null;
}

function getBannerUrl(
  images: { coverType: string; remoteUrl: string }[]
): string | null {
  const banner = images?.find((img) => img.coverType === "banner");
  return banner?.remoteUrl || null;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const seriesId = Number(id);
  const router = useRouter();

  const { data: series, mutate: mutateSeries } = useSonarrSerie(seriesId);
  const { data: episodes } = useSonarrEpisodes(seriesId);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const posterUrl = series ? getPosterUrl(series.images) : null;
  const bannerUrl = series ? getBannerUrl(series.images) : null;

  // Group episodes by season
  const seasonMap = useMemo(() => {
    if (!episodes) return new Map<number, typeof episodes>();
    const map = new Map<number, typeof episodes>();
    for (const ep of episodes) {
      const existing = map.get(ep.seasonNumber) || [];
      existing.push(ep);
      map.set(ep.seasonNumber, existing);
    }
    return new Map([...map.entries()].sort(([a], [b]) => a - b));
  }, [episodes]);

  const downloaded = series?.statistics?.episodeFileCount ?? 0;
  const total = series?.statistics?.episodeCount ?? 0;

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      switch (action) {
        case "search":
          await searchSeries(seriesId);
          break;
        case "refresh":
          await refreshSeries(seriesId);
          mutateSeries();
          break;
        case "delete":
          await deleteSeries(seriesId, true);
          router.push("/sonarr/series");
          return;
      }
    } catch {
      // error handling could be added here
    } finally {
      setActionLoading(null);
    }
  }

  if (!series) {
    return (
      <div>
        <PageHeader title="Serie" />
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/sonarr/series"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zu Serien
      </Link>

      <PageHeader
        title={series.title}
        description={`${series.year} ${series.network ? `· ${series.network}` : ""}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("search")}
              disabled={actionLoading === "search"}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
            >
              {actionLoading === "search" ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <Search size={12} /> Suche
                </span>
              )}
            </button>
            <button
              onClick={() => handleAction("refresh")}
              disabled={actionLoading === "refresh"}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] text-foreground border border-white/[0.08] hover:bg-white/[0.08] transition-colors disabled:opacity-50"
            >
              {actionLoading === "refresh" ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={12} /> Aktualisieren
                </span>
              )}
            </button>
            <EditSeriesPanel series={series} onSaved={() => mutateSeries()} />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Trash2 size={12} /> Löschen
              </span>
            </button>
          </div>
        }
      />

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="mb-6 border-accent-red/30">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Serie und alle Dateien wirklich löschen?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleAction("delete")}
                disabled={actionLoading === "delete"}
                className="px-3 py-1.5 rounded-lg text-xs bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25 transition-colors disabled:opacity-50"
              >
                {actionLoading === "delete" ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  "Endgültig löschen"
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Banner + Poster + Info */}
      <div className="relative mb-6">
        {bannerUrl && (
          <div className="rounded-xl overflow-hidden mb-4 h-32 md:h-44">
            <img
              src={bannerUrl}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="shrink-0 w-40 md:w-48">
            <div className="rounded-xl overflow-hidden border border-white/[0.06] aspect-[2/3] bg-white/[0.02]">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={series.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tv size={48} className="text-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={series.monitored ? "success" : "default"}
              >
                {series.monitored ? (
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> Überwacht
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff size={10} /> Nicht überwacht
                  </span>
                )}
              </Badge>
              <Badge
                variant={series.status === "continuing" ? "info" : "default"}
              >
                {series.status === "continuing" ? "Fortlaufend" : "Beendet"}
              </Badge>
              {series.certification && (
                <Badge variant="default">{series.certification}</Badge>
              )}
              {series.seriesType && (
                <Badge variant="default">{series.seriesType}</Badge>
              )}
            </div>

            {/* Overview */}
            {series.overview && (
              <p className="text-sm text-muted leading-relaxed line-clamp-4">
                {series.overview}
              </p>
            )}

            {/* Genres */}
            {series.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {series.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full text-xs bg-white/[0.05] text-muted border border-white/[0.06]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {series.runtime > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock size={14} />
                  <span>{series.runtime} Min.</span>
                </div>
              )}
              {series.firstAired && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar size={14} />
                  <span>
                    {new Date(series.firstAired).toLocaleDateString("de-DE")}
                  </span>
                </div>
              )}
              {series.ratings && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Star size={14} />
                  <span>
                    {series.ratings.value.toFixed(1)} ({series.ratings.votes})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Episoden</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Heruntergeladen</span>
              <span className="font-bold">
                {downloaded}/{total}
              </span>
            </div>
            <ProgressBar
              value={downloaded}
              max={total || 1}
              color={downloaded === total && total > 0 ? "emerald" : "cyan"}
              showLabel
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted">Staffeln</span>
              <span>{series.statistics?.seasonCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Größe</span>
              <span>{formatBytes(series.statistics?.sizeOnDisk ?? 0)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Qualitätsprofil</span>
              <span>{series.qualityProfileId}</span>
            </div>
            {series.rootFolderPath && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Stammordner</span>
                <span className="truncate ml-4 text-right max-w-[200px]">
                  {series.rootFolderPath}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted">Pfad</span>
              <span className="truncate ml-4 text-right max-w-[200px]">
                {series.path}
              </span>
            </div>
            {series.network && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Sender</span>
                <span>{series.network}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Season Accordions */}
      <h3 className="text-sm font-medium text-muted mb-4">
        Staffeln & Episoden
      </h3>
      <div className="space-y-2">
        {[...seasonMap.entries()].map(([seasonNumber, seasonEpisodes]) => {
          const seasonInfo = series.seasons.find(
            (s) => s.seasonNumber === seasonNumber
          );
          return (
            <SeasonPanel
              key={seasonNumber}
              seasonNumber={seasonNumber}
              episodes={seasonEpisodes ?? []}
              monitored={seasonInfo?.monitored ?? true}
              seriesId={seriesId}
            />
          );
        })}
        {seasonMap.size === 0 && (
          <Card>
            <div className="text-center py-8 text-sm text-muted">
              Keine Episoden geladen
            </div>
          </Card>
        )}
      </div>

      {/* Manual Release Search */}
      <div className="mt-6">
        <ReleasesPanel seriesId={seriesId} />
      </div>
    </div>
  );
}
