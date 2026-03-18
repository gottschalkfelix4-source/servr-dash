"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Film,
  Plus,
  Check,
  AlertCircle,
  X,
  Star,
  Clock,
  Calendar,
} from "lucide-react";
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
import { TrendingGrid } from "@/components/ui/TrendingGrid";

export default function AddMoviePage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RadarrLookupResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<RadarrLookupResult | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div>
      <PageHeader
        title="Film hinzufügen"
        description="Suche nach einem Film und füge ihn zu Radarr hinzu"
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
          className="w-full pl-9 pr-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)] transition-all"
          autoFocus
        />
        {searching && (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        )}
      </div>

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {results.map((result) => {
            const poster = result.images.find(
              (img) => img.coverType === "poster"
            )?.remoteUrl;

            return (
              <button
                key={result.tmdbId}
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
                      <Film size={28} className="text-muted/20" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="text-xs font-medium leading-tight line-clamp-2">
                      {result.title}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {result.year}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty search state */}
      {search && !searching && results.length === 0 && (
        <div className="text-center py-16">
          <Film size={48} className="mx-auto text-muted/30 mb-4" />
          <p className="text-sm text-muted">
            Keine Ergebnisse für &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {/* Trending suggestions when no search */}
      {!search && results.length === 0 && !searching && (
        <TrendingGrid
          type="movie"
          onSelect={(title) => handleSearchChange(title)}
        />
      )}

      {/* Add Movie Modal */}
      {selected && (
        <AddMovieModal
          movie={selected}
          onClose={() => setSelected(null)}
          onAdded={(title, success) => {
            setSelected(null);
            setFeedback({
              type: success ? "success" : "error",
              message: success
                ? `"${title}" wurde erfolgreich hinzugefügt.`
                : `Fehler beim Hinzufügen von "${title}". Möglicherweise bereits vorhanden.`,
            });
          }}
        />
      )}
    </div>
  );
}

// --- Add Movie Modal ---

function AddMovieModal({
  movie,
  onClose,
  onAdded,
}: {
  movie: RadarrLookupResult;
  onClose: () => void;
  onAdded: (title: string, success: boolean) => void;
}) {
  const { data: profiles } = useRadarrProfiles();
  const { data: rootFolders } = useRadarrRootFolders();

  const [profileId, setProfileId] = useState<number>(0);
  const [rootFolderPath, setRootFolderPath] = useState("");
  const [monitored, setMonitored] = useState(true);
  const [minAvail, setMinAvail] = useState("released");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (profiles?.length && !profileId) setProfileId(profiles[0].id);
  }, [profiles, profileId]);

  useEffect(() => {
    if (rootFolders?.length && !rootFolderPath)
      setRootFolderPath(rootFolders[0].path);
  }, [rootFolders, rootFolderPath]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = async () => {
    if (!profileId || !rootFolderPath) return;
    setAdding(true);
    try {
      await addMovie({
        title: movie.title,
        tmdbId: movie.tmdbId,
        year: movie.year,
        qualityProfileId: profileId,
        rootFolderPath,
        monitored,
        minimumAvailability: minAvail,
        addOptions: { searchForMovie: true },
      });
      onAdded(movie.title, true);
    } catch {
      onAdded(movie.title, false);
    } finally {
      setAdding(false);
    }
  };

  const poster = movie.images.find(
    (img) => img.coverType === "poster"
  )?.remoteUrl;

  const selectClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-card-solid/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header with poster + info */}
        <div className="flex gap-4 p-5">
          {/* Poster */}
          <div className="shrink-0 w-28 rounded-xl overflow-hidden border border-white/[0.06] aspect-[2/3] bg-white/[0.02]">
            {poster ? (
              <img
                src={poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film size={32} className="text-muted/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <h2 className="text-lg font-semibold leading-tight">
              {movie.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted">
                <Calendar size={11} />
                {movie.year}
              </span>
              {movie.runtime > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock size={11} />
                  {movie.runtime} Min.
                </span>
              )}
              {movie.ratings?.imdb && (
                <span className="flex items-center gap-1 text-xs text-accent-amber">
                  <Star size={11} className="fill-accent-amber" />
                  {movie.ratings.imdb.value}/10
                </span>
              )}
            </div>
            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {movie.genres.slice(0, 4).map((g) => (
                  <Badge key={g} variant="default">
                    {g}
                  </Badge>
                ))}
              </div>
            )}
            {movie.certification && (
              <Badge variant="info" className="mt-2">
                {movie.certification}
              </Badge>
            )}
          </div>
        </div>

        {/* Overview */}
        {movie.overview && (
          <div className="px-5 pb-4">
            <p className="text-xs text-muted leading-relaxed line-clamp-3">
              {movie.overview}
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
                value={rootFolderPath}
                onChange={(e) => setRootFolderPath(e.target.value)}
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
                Verfügbarkeit
              </label>
              <select
                className={selectClass}
                value={minAvail}
                onChange={(e) => setMinAvail(e.target.value)}
              >
                <option value="announced">Angekündigt</option>
                <option value="inCinemas">Im Kino</option>
                <option value="released">Veröffentlicht</option>
                <option value="preDB">PreDB</option>
              </select>
            </div>
            <div>
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
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={adding || !profileId || !rootFolderPath}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-cyan text-background text-sm font-semibold hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Plus size={16} />
            )}
            {adding ? "Wird hinzugefügt..." : "Film hinzufügen & suchen"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
