"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Check, X, Tv } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
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
import { ArrowLeft } from "lucide-react";

export default function AddSeriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SonarrLookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Config data
  const { data: profiles } = useSonarrProfiles();
  const { data: rootFolders } = useSonarrRootFolders();

  // Add form state
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [selectedRoot, setSelectedRoot] = useState("");
  const [seriesType, setSeriesType] = useState("standard");
  const [seasonFolder, setSeasonFolder] = useState(true);
  const [monitored, setMonitored] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addResult, setAddResult] = useState<{
    id: number;
    success: boolean;
    message: string;
  } | null>(null);

  // Set defaults when config loads
  useEffect(() => {
    if (profiles?.length && !selectedProfile) {
      setSelectedProfile(profiles[0].id);
    }
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (rootFolders?.length && !selectedRoot) {
      setSelectedRoot(rootFolders[0].path);
    }
  }, [rootFolders, selectedRoot]);

  // Debounced search
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

  async function handleAdd(result: SonarrLookupResult) {
    setAddingId(result.tvdbId);
    setAddResult(null);
    try {
      await addSeries({
        tvdbId: result.tvdbId,
        title: result.title,
        qualityProfileId: selectedProfile,
        rootFolderPath: selectedRoot,
        seriesType,
        seasonFolder,
        monitored,
        images: result.images,
        seasons: result.seasons.map((s) => ({
          seasonNumber: s.seasonNumber,
          monitored,
        })),
        addOptions: {
          searchForMissingEpisodes: monitored,
        },
      });
      setAddResult({
        id: result.tvdbId,
        success: true,
        message: "Serie erfolgreich hinzugefügt",
      });
    } catch (err) {
      setAddResult({
        id: result.tvdbId,
        success: false,
        message:
          err instanceof Error ? err.message : "Fehler beim Hinzufügen",
      });
    } finally {
      setAddingId(null);
    }
  }

  function getPosterUrl(result: SonarrLookupResult): string | null {
    const poster = result.images.find((img) => img.coverType === "poster");
    return poster?.remoteUrl || null;
  }

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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm placeholder:text-muted focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-colors"
          autoFocus
        />
      </div>

      {/* Loading */}
      {searching && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {/* Results */}
      {!searching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => {
            const poster = getPosterUrl(result);
            const isExpanded = expandedId === result.tvdbId;
            const resultStatus = addResult?.id === result.tvdbId ? addResult : null;

            return (
              <Card key={result.tvdbId} className="overflow-hidden">
                <div
                  className="flex gap-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : result.tvdbId)
                  }
                >
                  {/* Poster */}
                  <div className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-white/[0.02]">
                    {poster ? (
                      <img
                        src={poster}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv size={24} className="text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {result.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted">{result.year}</span>
                      {result.network && (
                        <Badge variant="default">{result.network}</Badge>
                      )}
                      <Badge
                        variant={
                          result.status === "continuing" ? "info" : "default"
                        }
                      >
                        {result.status === "continuing"
                          ? "Fortlaufend"
                          : "Beendet"}
                      </Badge>
                      <span className="text-xs text-muted">
                        {result.seasons.length} Staffeln
                      </span>
                    </div>
                    {result.overview && (
                      <p className="text-xs text-muted mt-1.5 line-clamp-2">
                        {result.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded config panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Quality Profile */}
                      <div>
                        <label className="text-xs text-muted block mb-1">
                          Qualitätsprofil
                        </label>
                        <select
                          value={selectedProfile}
                          onChange={(e) =>
                            setSelectedProfile(Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm focus:outline-none focus:border-accent-cyan/40"
                        >
                          {profiles?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Root Folder */}
                      <div>
                        <label className="text-xs text-muted block mb-1">
                          Stammordner
                        </label>
                        <select
                          value={selectedRoot}
                          onChange={(e) => setSelectedRoot(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm focus:outline-none focus:border-accent-cyan/40"
                        >
                          {rootFolders?.map((f) => (
                            <option key={f.id} value={f.path}>
                              {f.path}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Series Type */}
                      <div>
                        <label className="text-xs text-muted block mb-1">
                          Serientyp
                        </label>
                        <select
                          value={seriesType}
                          onChange={(e) => setSeriesType(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm focus:outline-none focus:border-accent-cyan/40"
                        >
                          <option value="standard">Standard</option>
                          <option value="daily">Täglich</option>
                          <option value="anime">Anime</option>
                        </select>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seasonFolder}
                          onChange={(e) => setSeasonFolder(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-cyan-500"
                        />
                        Staffelordner
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={monitored}
                          onChange={(e) => setMonitored(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-cyan-500"
                        />
                        Überwacht
                      </label>
                    </div>

                    {/* Add button + feedback */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAdd(result)}
                        disabled={addingId === result.tvdbId}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {addingId === result.tvdbId ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <>
                            <Plus size={12} /> Hinzufügen
                          </>
                        )}
                      </button>

                      {resultStatus && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            resultStatus.success
                              ? "text-accent-emerald"
                              : "text-accent-red"
                          }`}
                        >
                          {resultStatus.success ? (
                            <Check size={12} />
                          ) : (
                            <X size={12} />
                          )}
                          {resultStatus.message}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
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
    </div>
  );
}
