"use client";

import { Badge } from "@/components/ui/Badge";
import type { SonarrEpisode } from "@/types/sonarr";

interface EpisodeRowProps {
  episode: SonarrEpisode;
  onToggleMonitor?: (episodeId: number, monitored: boolean) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function EpisodeRow({ episode, onToggleMonitor }: EpisodeRowProps) {
  const epCode = `E${pad(episode.episodeNumber)}`;
  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "---";

  const qualityName = episode.episodeFile?.quality?.quality?.name;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group">
      {/* Monitor checkbox */}
      <input
        type="checkbox"
        checked={episode.monitored}
        onChange={() => onToggleMonitor?.(episode.id, !episode.monitored)}
        className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer"
      />

      {/* Episode number */}
      <span className="text-xs font-mono text-muted w-10 shrink-0">
        {epCode}
      </span>

      {/* Title */}
      <span className="text-sm truncate flex-1 min-w-0">
        {episode.title || "TBA"}
      </span>

      {/* Air date */}
      <span className="text-xs text-muted shrink-0 hidden sm:block">
        {airDate}
      </span>

      {/* Status badge */}
      {episode.hasFile ? (
        <Badge variant="success">Vorhanden</Badge>
      ) : episode.airDate && new Date(episode.airDate) < new Date() ? (
        <Badge variant="danger">Fehlt</Badge>
      ) : (
        <Badge variant="default">Ausstehend</Badge>
      )}

      {/* Quality badge */}
      {qualityName && (
        <Badge variant="info" className="hidden md:inline-flex">
          {qualityName}
        </Badge>
      )}
    </div>
  );
}
