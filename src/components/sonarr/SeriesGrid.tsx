"use client";

import { useState, useMemo } from "react";
import { Search, Minus, Plus } from "lucide-react";
import { SeriesCard } from "./SeriesCard";
import type { SonarrSeries } from "@/types/sonarr";

type Filter = "all" | "monitored" | "continuing" | "ended";

interface SeriesGridProps {
  series: SonarrSeries[];
}

const sizeGridCols = [
  "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",                  // 0 = XXL
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",                  // 1 = XL
  "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",   // 2 = L (default)
  "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",   // 3 = M
  "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8",   // 4 = S
  "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",  // 5 = XS
  "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12", // 6 = XXS
  "grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16",// 7 = Mini
];

export function SeriesGrid({ series }: SeriesGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [size, setSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sonarr-grid-size");
      return saved ? parseInt(saved) : 2;
    }
    return 2;
  });

  const updateSize = (newSize: number) => {
    setSize(newSize);
    localStorage.setItem("sonarr-grid-size", String(newSize));
  };

  const filtered = useMemo(() => {
    let result = series;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.network?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "monitored":
        result = result.filter((s) => s.monitored);
        break;
      case "continuing":
        result = result.filter((s) => s.status === "continuing");
        break;
      case "ended":
        result = result.filter((s) => s.status === "ended");
        break;
    }

    return result.sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));
  }, [series, search, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "monitored", label: "Überwacht" },
    { key: "continuing", label: "Fortlaufend" },
    { key: "ended", label: "Beendet" },
  ];

  return (
    <div>
      {/* Search & Filters & Size */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Serien durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm placeholder:text-muted focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
                  : "bg-white/[0.03] text-muted border border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              {f.label}
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
          {filtered.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-sm text-muted">Keine Serien gefunden</p>
        </div>
      )}
    </div>
  );
}
