"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EpisodeRow } from "./EpisodeRow";
import type { SonarrEpisode } from "@/types/sonarr";

interface SeasonPanelProps {
  seasonNumber: number;
  episodes: SonarrEpisode[];
  monitored: boolean;
  onToggleEpisodeMonitor?: (episodeId: number, monitored: boolean) => void;
}

export function SeasonPanel({
  seasonNumber,
  episodes,
  monitored,
  onToggleEpisodeMonitor,
}: SeasonPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const downloaded = episodes.filter((e) => e.hasFile).length;
  const total = episodes.length;
  const label =
    seasonNumber === 0 ? "Specials" : `Staffel ${seasonNumber}`;

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-muted shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-muted shrink-0" />
        )}

        <span className="text-sm font-medium flex-1">{label}</span>

        {!monitored && (
          <span className="text-xs text-muted">Nicht überwacht</span>
        )}

        <span className="text-xs text-muted font-mono">
          {downloaded}/{total} Episoden
        </span>
      </button>

      {/* Episode list */}
      {expanded && (
        <div className="border-t border-white/[0.04]">
          {episodes
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
            .map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                onToggleMonitor={onToggleEpisodeMonitor}
              />
            ))}
          {episodes.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Keine Episoden
            </div>
          )}
        </div>
      )}
    </div>
  );
}
