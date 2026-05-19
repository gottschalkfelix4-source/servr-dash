"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatusDot } from "@/components/ui/StatusDot";
import type { RadarrMovie } from "@/types/radarr";

function getPosterUrl(movie: RadarrMovie): string | null {
  const poster = movie.images.find((img) => img.coverType === "poster");
  return poster?.remoteUrl || null;
}

function getFileStatus(movie: RadarrMovie) {
  if (movie.hasFile) return { label: "Vorhanden", variant: "success" as const };
  if (!movie.monitored) return { label: "Nicht ueberwacht", variant: "default" as const };
  return { label: "Fehlend", variant: "danger" as const };
}

interface MovieCardProps {
  movie: RadarrMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie);
  const fileStatus = getFileStatus(movie);

  return (
    <Link href={`/radarr/movies/${movie.id}`}>
      <div className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors duration-150 hover:border-border-glow hover:bg-card-hover">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-white/[0.02]">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film size={48} className="text-muted/30" />
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <StatusDot
              status={movie.monitored ? "online" : "unknown"}
              className="h-3 w-3"
            />
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
            <Badge variant={fileStatus.variant}>{fileStatus.label}</Badge>
            {movie.hasFile && movie.movieFile && (
              <Badge variant="info">
                {movie.movieFile.quality.quality.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="p-3">
          <h3 className="text-sm font-medium truncate">{movie.title}</h3>
          <p className="text-xs text-muted mt-0.5">{movie.year}</p>
        </div>
      </div>
    </Link>
  );
}
