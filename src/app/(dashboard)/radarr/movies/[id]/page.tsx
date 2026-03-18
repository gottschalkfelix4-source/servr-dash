"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Film,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  Clock,
  HardDrive,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatBytes } from "@/lib/utils";
import {
  useRadarrMovie,
  searchMovie,
  refreshMovie,
  deleteMovie,
} from "@/hooks/useRadarr";
import { ReleasesPanel } from "@/components/radarr/ReleasesPanel";

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const movieId = Number(id);
  const router = useRouter();
  const { data: movie, mutate: mutateMovie } = useRadarrMovie(movieId);
  const [acting, setActing] = useState(false);

  if (!movie) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const posterUrl = movie.images.find(
    (img) => img.coverType === "poster"
  )?.remoteUrl;
  const fanartUrl = movie.images.find(
    (img) => img.coverType === "fanart"
  )?.remoteUrl;

  const handleSearch = async () => {
    setActing(true);
    try {
      await searchMovie(movieId);
    } finally {
      setActing(false);
    }
  };

  const handleRefresh = async () => {
    setActing(true);
    try {
      await refreshMovie(movieId);
      mutateMovie();
    } finally {
      setActing(false);
    }
  };

  const handleToggleMonitor = async () => {
    setActing(true);
    try {
      await fetch(`/api/radarr/movies/${movieId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...movie, monitored: !movie.monitored }),
      });
      mutateMovie();
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Film wirklich l\öschen? Diese Aktion kann nicht r\ückg\ängig gemacht werden.")) return;
    const deleteFiles = confirm("Auch Dateien auf der Festplatte l\öschen?");
    setActing(true);
    try {
      await deleteMovie(movieId, deleteFiles);
      router.push("/radarr/movies");
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      {/* Fanart background */}
      {fanartUrl && (
        <div className="absolute inset-x-0 top-0 h-64 -z-10 overflow-hidden">
          <img
            src={fanartUrl}
            alt=""
            className="w-full h-full object-cover opacity-10 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      <PageHeader
        title={movie.title}
        description={`${movie.year} \· ${movie.runtime} min`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/radarr/movies"
              className="p-2 rounded-lg hover:bg-white/[0.06] text-muted transition-colors"
              title="Zur\ück"
            >
              <ArrowLeft size={16} />
            </Link>
            <button
              onClick={handleSearch}
              disabled={acting}
              className="p-2 rounded-lg hover:bg-accent-cyan/20 text-accent-cyan transition-colors"
              title="Suchen"
            >
              <Search size={16} />
            </button>
            <button
              onClick={handleRefresh}
              disabled={acting}
              className="p-2 rounded-lg hover:bg-accent-cyan/20 text-accent-cyan transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleToggleMonitor}
              disabled={acting}
              className={`p-2 rounded-lg transition-colors ${
                movie.monitored
                  ? "hover:bg-accent-amber/20 text-accent-amber"
                  : "hover:bg-accent-emerald/20 text-accent-emerald"
              }`}
              title={movie.monitored ? "\Überwachung deaktivieren" : "\Überwachung aktivieren"}
            >
              {movie.monitored ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={handleDelete}
              disabled={acting}
              className="p-2 rounded-lg hover:bg-accent-red/20 text-accent-red transition-colors"
              title="L\öschen"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 sm:gap-6">
        {/* Poster */}
        <div className="rounded-xl overflow-hidden border border-border bg-card mx-auto w-48 sm:w-full lg:mx-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[2/3] flex items-center justify-center bg-white/[0.02]">
              <Film size={64} className="text-muted/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={movie.monitored ? "success" : "default"}>
              <StatusDot
                status={movie.monitored ? "online" : "unknown"}
                className="mr-1.5"
              />
              {movie.monitored ? "\Überwacht" : "Nicht \überwacht"}
            </Badge>
            <Badge variant={movie.hasFile ? "success" : "danger"}>
              {movie.hasFile ? "Vorhanden" : "Fehlend"}
            </Badge>
            {movie.certification && (
              <Badge variant="info">{movie.certification}</Badge>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <Card>
              <CardHeader>
                <CardTitle>Beschreibung</CardTitle>
              </CardHeader>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {movie.overview}
              </p>
            </Card>
          )}

          {/* Info */}
          <Card glow="cyan">
            <CardHeader>
              <CardTitle>Informationen</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <InfoRow label="Genres" value={movie.genres.join(", ") || "\u2013"} />
              <InfoRow
                label="Laufzeit"
                value={`${movie.runtime} Minuten`}
                icon={<Clock size={14} className="text-muted" />}
              />
              {movie.ratings?.imdb && (
                <InfoRow
                  label="IMDb"
                  value={`${movie.ratings.imdb.value}/10`}
                  icon={<Star size={14} className="text-accent-amber" />}
                />
              )}
              <InfoRow label="Pfad" value={movie.path} mono />
              <InfoRow
                label="Gr\ö\ße"
                value={formatBytes(movie.sizeOnDisk)}
                icon={<HardDrive size={14} className="text-muted" />}
              />
              <InfoRow label="Studio" value={movie.studio || "\u2013"} />
              <InfoRow label="Status" value={movie.status} />
            </div>
          </Card>

          {/* File info */}
          {movie.hasFile && movie.movieFile && (
            <Card>
              <CardHeader>
                <CardTitle>Datei</CardTitle>
              </CardHeader>
              <div className="space-y-3 text-sm">
                <InfoRow
                  label="Qualit\ät"
                  value={movie.movieFile.quality.quality.name}
                />
                {movie.movieFile.mediaInfo && (
                  <>
                    <InfoRow
                      label="Video"
                      value={movie.movieFile.mediaInfo.videoCodec || "\u2013"}
                    />
                    <InfoRow
                      label="Audio"
                      value={
                        movie.movieFile.mediaInfo.audioCodec
                          ? `${movie.movieFile.mediaInfo.audioCodec} ${movie.movieFile.mediaInfo.audioChannels || ""}ch`
                          : "\u2013"
                      }
                    />
                    <InfoRow
                      label="Aufl\ösung"
                      value={movie.movieFile.mediaInfo.resolution || "\u2013"}
                    />
                  </>
                )}
                <InfoRow
                  label="Dateigr\ö\ße"
                  value={formatBytes(movie.movieFile.size)}
                />
                <InfoRow
                  label="Datei"
                  value={movie.movieFile.relativePath}
                  mono
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Manual Release Search */}
      <div className="mt-6">
        <ReleasesPanel movieId={movieId} />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted flex items-center gap-1.5 shrink-0">
        {icon}
        {label}
      </span>
      <span
        className={`text-right truncate ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
