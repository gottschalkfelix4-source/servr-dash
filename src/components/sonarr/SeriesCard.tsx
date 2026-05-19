"use client";

import Link from "next/link";
import { Tv } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SonarrSeries } from "@/types/sonarr";

interface SeriesCardProps {
  series: SonarrSeries;
}

function getPosterUrl(series: SonarrSeries): string | null {
  const poster = series.images.find((img) => img.coverType === "poster");
  return poster?.remoteUrl || null;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const posterUrl = getPosterUrl(series);
  const downloaded = series.statistics?.episodeFileCount ?? 0;
  const total = series.statistics?.episodeCount ?? 0;

  return (
    <Link href={`/sonarr/series/${series.id}`}>
      <div className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors duration-150 hover:border-border-glow hover:bg-card-hover">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-white/[0.02]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={series.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv size={48} className="text-muted" />
            </div>
          )}

          {/* Network badge */}
          {series.network && (
            <div className="absolute top-2 right-2">
              <Badge variant="default">{series.network}</Badge>
            </div>
          )}

          {/* Monitored dot */}
          <div className="absolute top-2 left-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                series.monitored
                  ? "bg-accent-emerald"
                  : "bg-muted/50"
              }`}
            />
          </div>

          {/* Bottom overlay with title */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <h3 className="text-sm font-medium truncate">{series.title}</h3>
            <p className="text-xs text-muted">{series.year}</p>
          </div>
        </div>

        {/* Episode progress */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">
              {downloaded}/{total} Episoden
            </span>
          </div>
          <ProgressBar
            value={downloaded}
            max={total || 1}
            color={downloaded === total && total > 0 ? "emerald" : "cyan"}
          />
        </div>
      </div>
    </Link>
  );
}
