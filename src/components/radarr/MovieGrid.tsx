"use client";

import { useState, useMemo } from "react";
import { Search, Film, Minus, Plus } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { RadarrMovie } from "@/types/radarr";

type FilterType = "all" | "monitored" | "unmonitored" | "missing";

interface MovieGridProps {
  movies: RadarrMovie[];
}

const filterLabels: Record<FilterType, string> = {
  all: "Alle",
  monitored: "Überwacht",
  unmonitored: "Nicht überwacht",
  missing: "Fehlend",
};

const sizeGridCols = [
  "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",                  // 0 = XXL
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",                  // 1 = XL
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",   // 2 = L (default)
  "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6",   // 3 = M
  "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8",   // 4 = S
  "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10",  // 5 = XS
  "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12", // 6 = XXS
  "grid-cols-8 sm:grid-cols-10 md:grid-cols-12 xl:grid-cols-16",// 7 = Mini
];

export function MovieGrid({ movies }: MovieGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("radarr-grid-size");
      return saved ? parseInt(saved) : 2;
    }
    return 2;
  });

  const updateSize = (newSize: number) => {
    setSize(newSize);
    localStorage.setItem("radarr-grid-size", String(newSize));
  };

  const filtered = useMemo(() => {
    let result = movies;

    switch (filter) {
      case "monitored":
        result = result.filter((m) => m.monitored);
        break;
      case "unmonitored":
        result = result.filter((m) => !m.monitored);
        break;
      case "missing":
        result = result.filter((m) => m.monitored && !m.hasFile);
        break;
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.year.toString().includes(term)
      );
    }

    return result;
  }, [movies, filter, search]);

  return (
    <div>
      {/* Search + Filters + Size */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Filme suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)] transition-all"
          />
        </div>
        <div className="flex gap-1">
          {(Object.keys(filterLabels) as FilterType[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? "bg-accent-cyan/15 text-accent-cyan shadow-[0_0_10px_-3px_rgba(34,211,238,0.3)]"
                  : "bg-white/[0.04] text-muted hover:bg-white/[0.08] hover:text-foreground"
              }`}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
        {/* Size controls */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg border border-white/[0.06] px-1">
          <button
            onClick={() => updateSize(Math.min(size + 1, sizeGridCols.length - 1))}
            disabled={size >= sizeGridCols.length - 1}
            className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30"
            title="Kleiner"
          >
            <Minus size={14} />
          </button>
          <div className="w-px h-4 bg-white/[0.08]" />
          <button
            onClick={() => updateSize(Math.max(size - 1, 0))}
            disabled={size <= 0}
            className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-30"
            title="Größer"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className={`grid ${sizeGridCols[size]} gap-4`}>
          {filtered.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Film size={48} className="mx-auto text-muted/30 mb-4" />
          <p className="text-sm text-muted">Keine Filme gefunden</p>
        </div>
      )}
    </div>
  );
}
