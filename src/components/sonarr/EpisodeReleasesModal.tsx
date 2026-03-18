"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, Check, Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils";

interface Release {
  guid: string;
  title: string;
  quality: { quality: { name: string } };
  size: number;
  indexer: string;
  indexerId: number;
  seeders?: number;
  leechers?: number;
  protocol: string;
  approved: boolean;
  rejections?: string[];
  age: number;
}

interface EpisodeReleasesModalProps {
  seriesId: number;
  episodeId: number;
  episodeTitle: string;
  episodeCode: string;
  onClose: () => void;
}

export function EpisodeReleasesModal({
  seriesId,
  episodeId,
  episodeTitle,
  episodeCode,
  onClose,
}: EpisodeReleasesModalProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grabbed, setGrabbed] = useState<Set<string>>(new Set());
  const [grabbing, setGrabbing] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sonarr/series/${seriesId}/releases?episodeId=${episodeId}`
      );
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const data = await res.json();
      setReleases(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Releases konnten nicht geladen werden"
      );
    } finally {
      setLoading(false);
    }
  }, [seriesId, episodeId]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleGrab = async (release: Release) => {
    setGrabbing(release.guid);
    try {
      const res = await fetch(`/api/sonarr/series/${seriesId}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guid: release.guid, indexerId: release.indexerId }),
      });
      if (!res.ok) throw new Error("Grab fehlgeschlagen");
      setGrabbed((prev) => new Set(prev).add(release.guid));
    } catch {
      // could show error
    } finally {
      setGrabbing(null);
    }
  };

  const filtered = releases.filter(
    (r) =>
      !filter ||
      r.title.toLowerCase().includes(filter.toLowerCase()) ||
      r.quality.quality.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.indexer.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/[0.08] bg-card-solid/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="font-semibold text-base">Manuelle Suche</h2>
            <p className="text-xs text-muted mt-0.5">
              {episodeCode} — {episodeTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Releases filtern..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner className="h-6 w-6" />
              <span className="text-sm text-muted">
                Durchsuche Indexer...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-accent-red">
              <AlertTriangle size={24} />
              <span className="text-sm">{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted">
              {releases.length === 0
                ? "Keine Releases gefunden"
                : "Keine Ergebnisse für den Filter"}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((release) => (
                <ReleaseRow
                  key={release.guid}
                  release={release}
                  isGrabbed={grabbed.has(release.guid)}
                  isGrabbing={grabbing === release.guid}
                  onGrab={() => handleGrab(release)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted">
          <span>
            {loading
              ? "Suche läuft..."
              : `${filtered.length} von ${releases.length} Releases`}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors text-foreground"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function ReleaseRow({
  release,
  isGrabbed,
  isGrabbing,
  onGrab,
}: {
  release: Release;
  isGrabbed: boolean;
  isGrabbing: boolean;
  onGrab: () => void;
}) {
  const [showRejections, setShowRejections] = useState(false);
  const hasRejections = release.rejections && release.rejections.length > 0;

  return (
    <div className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        {/* Grab button */}
        <div className="pt-0.5 shrink-0">
          {isGrabbed ? (
            <div className="h-8 w-8 rounded-lg bg-accent-emerald/15 flex items-center justify-center">
              <Check size={14} className="text-accent-emerald" />
            </div>
          ) : (
            <button
              onClick={onGrab}
              disabled={isGrabbing || !release.approved}
              className="h-8 w-8 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 flex items-center justify-center text-accent-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={release.approved ? "Release herunterladen" : "Abgelehnt"}
            >
              {isGrabbing ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <Download size={14} />
              )}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-foreground/90 break-all leading-relaxed">
            {release.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="info">{release.quality.quality.name}</Badge>
            <span className="text-[10px] text-muted">{release.indexer}</span>
            <span className="text-[10px] text-muted">
              {formatBytes(release.size)}
            </span>
            {release.protocol === "torrent" && release.seeders != null && (
              <span className="text-[10px] text-muted">
                ▲{release.seeders} ▼{release.leechers ?? 0}
              </span>
            )}
            <span className="text-[10px] text-muted">
              {release.age > 0 ? `${release.age}d` : "neu"}
            </span>
            <Badge
              variant={release.protocol === "usenet" ? "default" : "warning"}
            >
              {release.protocol === "usenet" ? "Usenet" : "Torrent"}
            </Badge>
            {hasRejections && (
              <button
                onClick={() => setShowRejections(!showRejections)}
                className="text-[10px] text-accent-amber hover:underline"
              >
                {release.rejections!.length} Ablehnungsgründe
              </button>
            )}
          </div>
          {showRejections && hasRejections && (
            <div className="mt-2 p-2 rounded-lg bg-accent-amber/5 border border-accent-amber/10">
              {release.rejections!.map((r, i) => (
                <p key={i} className="text-[10px] text-accent-amber">
                  • {r}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
