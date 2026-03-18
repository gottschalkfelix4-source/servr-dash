"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Film, Plus, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useRadarrProfiles,
  useRadarrRootFolders,
  lookupMovies,
  addMovie,
} from "@/hooks/useRadarr";
import type { RadarrLookupResult } from "@/types/radarr";

export default function AddMoviePage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RadarrLookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [rootFolderId, setRootFolderId] = useState<number | null>(null);
  const [monitored, setMonitored] = useState(true);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: profiles } = useRadarrProfiles();
  const { data: rootFolders } = useRadarrRootFolders();

  // Set defaults when data loads
  useEffect(() => {
    if (profiles?.length && !profileId) setProfileId(profiles[0].id);
  }, [profiles, profileId]);

  useEffect(() => {
    if (rootFolders?.length && !rootFolderId) setRootFolderId(rootFolders[0].id);
  }, [rootFolders, rootFolderId]);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await lookupMovies(term);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFeedback(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 500);
  };

  const handleAdd = async (result: RadarrLookupResult) => {
    if (!profileId || !rootFolderId) return;

    const rootFolder = rootFolders?.find((f) => f.id === rootFolderId);
    if (!rootFolder) return;

    setAdding(true);
    setFeedback(null);
    try {
      await addMovie({
        title: result.title,
        tmdbId: result.tmdbId,
        year: result.year,
        qualityProfileId: profileId,
        rootFolderPath: rootFolder.path,
        monitored,
        minimumAvailability: "released",
        addOptions: { searchForMovie: true },
      });
      setFeedback({
        type: "success",
        message: `"${result.title}" wurde erfolgreich hinzugef\ügt.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: `Fehler beim Hinzuf\ügen von "${result.title}". M\öglicherweise bereits vorhanden.`,
      });
    } finally {
      setAdding(false);
    }
  };

  const selectedResult = results.find((r) => r.tmdbId === selectedId);

  return (
    <div>
      <PageHeader
        title="Film hinzuf\ügen"
        description="Suche nach einem Film und f\üge ihn zu Radarr hinzu"
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

      {/* Search input */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Film suchen (z.B. Inception, The Matrix...)"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-lg bg-white/[0.04] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)] transition-all"
          autoFocus
        />
        {searching && (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        )}
      </div>

      {/* Settings row */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Quality Profile */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted mb-1 block">
            Qualit\ätsprofil
          </label>
          <select
            value={profileId || ""}
            onChange={(e) => setProfileId(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-border text-sm text-foreground focus:outline-none focus:border-accent-cyan/50 transition-all"
          >
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Root Folder */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted mb-1 block">
            Stammverzeichnis
          </label>
          <select
            value={rootFolderId || ""}
            onChange={(e) => setRootFolderId(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-border text-sm text-foreground focus:outline-none focus:border-accent-cyan/50 transition-all"
          >
            {rootFolders?.map((f) => (
              <option key={f.id} value={f.id}>
                {f.path}
              </option>
            ))}
          </select>
        </div>

        {/* Monitored toggle */}
        <div>
          <label className="text-xs text-muted mb-1 block">
            \Überwacht
          </label>
          <button
            onClick={() => setMonitored(!monitored)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              monitored
                ? "bg-accent-emerald/15 text-accent-emerald"
                : "bg-white/[0.04] text-muted"
            }`}
          >
            {monitored ? "Ja" : "Nein"}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((result) => {
            const poster = result.images.find(
              (img) => img.coverType === "poster"
            )?.remoteUrl;
            const isSelected = selectedId === result.tmdbId;

            return (
              <div key={result.tmdbId}>
                <div
                  onClick={() =>
                    setSelectedId(isSelected ? null : result.tmdbId)
                  }
                  className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "border-accent-cyan shadow-[0_0_20px_-5px_rgba(34,211,238,0.3)] scale-[1.02]"
                      : "border-border hover:border-border-glow bg-card"
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-white/[0.02]">
                    {poster ? (
                      <img
                        src={poster}
                        alt={result.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={36} className="text-muted/30" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">
                      {result.title}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">{result.year}</p>
                  </div>
                </div>

                {/* Add button for selected */}
                {isSelected && (
                  <button
                    onClick={() => handleAdd(result)}
                    disabled={adding || !profileId || !rootFolderId}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Hinzuf\ügen
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overview of selected */}
      {selectedResult?.overview && (
        <Card className="mt-6">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {selectedResult.overview}
          </p>
          <div className="flex flex-wrap gap-1 mt-3">
            {selectedResult.genres.map((g) => (
              <Badge key={g} variant="default">
                {g}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {search && !searching && results.length === 0 && (
        <div className="text-center py-16">
          <Film size={48} className="mx-auto text-muted/30 mb-4" />
          <p className="text-sm text-muted">
            Keine Ergebnisse f\ür &ldquo;{search}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
