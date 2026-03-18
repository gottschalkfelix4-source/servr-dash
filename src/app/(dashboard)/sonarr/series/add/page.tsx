"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Check,
  X,
  Tv,
  Star,
  Calendar,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  useSonarrProfiles,
  useSonarrRootFolders,
  lookupSeries,
  addSeries,
} from "@/hooks/useSonarr";
import type { SonarrLookupResult } from "@/types/sonarr";
import { TrendingGrid } from "@/components/ui/TrendingGrid";
import Link from "next/link";

export default function AddSeriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SonarrLookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SonarrLookupResult | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const doSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await lookupSeries(term);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(searchTerm), 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, doSearch]);

  return (
    <div>
      <Link
        href="/sonarr/series"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zu Serien
      </Link>

      <PageHeader
        title="Serie hinzufügen"
        description="Suche nach TV-Serien und füge sie zu Sonarr hinzu"
      />

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
            feedback.type === "success"
              ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20"
              : "bg-accent-red/10 text-accent-red border border-accent-red/20"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {feedback.message}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Serie suchen..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setFeedback(null);
          }}
          className="w-full pl-9 pr-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm placeholder:text-muted focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)] transition-all"
          autoFocus
        />
        {searching && (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        )}
      </div>

      {/* Results grid */}
      {!searching && results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {results.map((result) => {
            const poster = result.images.find(
              (img) => img.coverType === "poster"
            )?.remoteUrl;

            return (
              <button
                key={result.tvdbId}
                onClick={() => setSelected(result)}
                className="group text-left rounded-xl border border-white/[0.04] overflow-hidden hover:border-accent-cyan/30 hover:shadow-[0_0_20px_-8px_rgba(34,211,238,0.2)] transition-all duration-300"
              >
                <div className="relative aspect-[2/3] bg-white/[0.02]">
                  {poster ? (
                    <img
                      src={poster}
                      alt={result.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Tv size={28} className="text-muted/20" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {result.ratings && result.ratings.value > 0 && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium">
                      <Star
                        size={9}
                        className="text-accent-amber fill-accent-amber"
                      />
                      {result.ratings.value.toFixed(1)}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="text-xs font-medium leading-tight line-clamp-2">
                      {result.title}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {result.year}
                      {result.network ? ` · ${result.network}` : ""}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {/* Empty search */}
      {!searching && searchTerm.length >= 2 && results.length === 0 && (
        <div className="text-center py-16">
          <Tv size={48} className="mx-auto text-muted mb-4" />
          <p className="text-sm text-muted">Keine Ergebnisse gefunden</p>
        </div>
      )}

      {/* Trending suggestions when no search */}
      {!searching && searchTerm.length < 2 && (
        <TrendingGrid
          type="tv"
          onSelect={(title) => setSearchTerm(title)}
        />
      )}

      {/* Add Series Modal */}
      {selected && (
        <AddSeriesModal
          series={selected}
          onClose={() => setSelected(null)}
          onAdded={(title, success, msg) => {
            setSelected(null);
            setFeedback({
              type: success ? "success" : "error",
              message: success
                ? `"${title}" wurde erfolgreich hinzugefügt.`
                : msg || `Fehler beim Hinzufügen von "${title}".`,
            });
          }}
        />
      )}
    </div>
  );
}

// --- Add Series Modal ---

function AddSeriesModal({
  series,
  onClose,
  onAdded,
}: {
  series: SonarrLookupResult;
  onClose: () => void;
  onAdded: (title: string, success: boolean, msg?: string) => void;
}) {
  const { data: profiles } = useSonarrProfiles();
  const { data: rootFolders } = useSonarrRootFolders();

  const [profileId, setProfileId] = useState(0);
  const [rootPath, setRootPath] = useState("");
  const [seriesType, setSeriesType] = useState(series.seriesType || "standard");
  const [seasonFolder, setSeasonFolder] = useState(true);
  const [monitored, setMonitored] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (profiles?.length && !profileId) setProfileId(profiles[0].id);
  }, [profiles, profileId]);

  useEffect(() => {
    if (rootFolders?.length && !rootPath) setRootPath(rootFolders[0].path);
  }, [rootFolders, rootPath]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = async () => {
    if (!profileId || !rootPath) return;
    setAdding(true);
    try {
      await addSeries({
        tvdbId: series.tvdbId,
        title: series.title,
        qualityProfileId: profileId,
        rootFolderPath: rootPath,
        seriesType,
        seasonFolder,
        monitored,
        images: series.images,
        seasons: series.seasons.map((s) => ({
          seasonNumber: s.seasonNumber,
          monitored,
        })),
        addOptions: { searchForMissingEpisodes: monitored },
      });
      onAdded(series.title, true);
    } catch (err) {
      onAdded(
        series.title,
        false,
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setAdding(false);
    }
  };

  const poster = series.images.find(
    (img) => img.coverType === "poster"
  )?.remoteUrl;

  const selectClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-card-solid/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex gap-4 p-5">
          <div className="shrink-0 w-28 rounded-xl overflow-hidden border border-white/[0.06] aspect-[2/3] bg-white/[0.02]">
            {poster ? (
              <img
                src={poster}
                alt={series.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tv size={32} className="text-muted/30" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 py-1">
            <h2 className="text-lg font-semibold leading-tight">
              {series.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted">
                <Calendar size={11} />
                {series.year}
              </span>
              {series.runtime > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={11} />
                  {series.runtime} Min.
                </span>
              )}
              {series.ratings && series.ratings.value > 0 && (
                <span className="flex items-center gap-1 text-xs text-accent-amber">
                  <Star size={11} className="fill-accent-amber" />
                  {series.ratings.value.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2.5">
              {series.network && (
                <Badge variant="info">{series.network}</Badge>
              )}
              <Badge
                variant={
                  series.status === "continuing" ? "success" : "default"
                }
              >
                {series.status === "continuing" ? "Fortlaufend" : "Beendet"}
              </Badge>
              <Badge variant="default">
                {series.seasons.length} Staffeln
              </Badge>
            </div>
            {series.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {series.genres.slice(0, 4).map((g) => (
                  <span
                    key={g}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-muted"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        {series.overview && (
          <div className="px-5 pb-4">
            <p className="text-xs text-muted leading-relaxed line-clamp-3">
              {series.overview}
            </p>
          </div>
        )}

        {/* Add options */}
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                Qualitätsprofil
              </label>
              <select
                className={selectClass}
                value={profileId}
                onChange={(e) => setProfileId(Number(e.target.value))}
              >
                {profiles?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                Stammordner
              </label>
              <select
                className={selectClass}
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
              >
                {rootFolders?.map((f) => (
                  <option key={f.id} value={f.path}>
                    {f.path}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                Serientyp
              </label>
              <select
                className={selectClass}
                value={seriesType}
                onChange={(e) => setSeriesType(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="daily">Täglich</option>
                <option value="anime">Anime</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                  Überwacht
                </label>
                <button
                  onClick={() => setMonitored(!monitored)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    monitored
                      ? "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20"
                      : "bg-white/[0.04] text-muted border border-white/[0.08]"
                  }`}
                >
                  {monitored ? "Ja" : "Nein"}
                </button>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted uppercase tracking-wide mb-1 block">
                  Staffelordner
                </label>
                <button
                  onClick={() => setSeasonFolder(!seasonFolder)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    seasonFolder
                      ? "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/20"
                      : "bg-white/[0.04] text-muted border border-white/[0.08]"
                  }`}
                >
                  {seasonFolder ? "Ja" : "Nein"}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={adding || !profileId || !rootPath}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan text-background text-sm font-semibold hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Wird hinzugefügt..." : "Serie hinzufügen & suchen"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
