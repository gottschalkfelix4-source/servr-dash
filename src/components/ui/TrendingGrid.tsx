"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Flame, Calendar, Star, Film, Tv } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface TrendingItem {
  tmdbId: number;
  title: string;
  year: number;
  overview: string;
  posterUrl: string | null;
  voteAverage: number;
  popularity: number;
  mediaType: "movie" | "tv";
}

interface TrendingGridProps {
  type: "movie" | "tv";
  onSelect: (title: string) => void;
}

const categories = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "popular", label: "Beliebt", icon: Flame },
  { key: "upcoming", label: "Bald verfügbar", icon: Calendar },
] as const;

export function TrendingGrid({ type, onSelect }: TrendingGridProps) {
  const [category, setCategory] = useState<string>("trending");
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/tmdb?type=${type}&category=${category}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [type, category]);

  if (error && items.length === 0) {
    return null; // Silently hide if TMDB not configured
  }

  const Icon = type === "movie" ? Film : Tv;

  return (
    <div>
      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-muted mr-1">Vorschläge:</span>
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat.key
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30"
                  : "bg-white/[0.03] text-muted border border-white/[0.06] hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              <CatIcon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {items.map((item) => (
            <button
              key={item.tmdbId}
              onClick={() => onSelect(item.title)}
              className="group text-left rounded-xl border border-white/[0.04] overflow-hidden hover:border-accent-cyan/30 hover:shadow-[0_0_20px_-8px_rgba(34,211,238,0.2)] transition-all duration-300"
            >
              <div className="relative aspect-[2/3] bg-white/[0.02]">
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={28} className="text-muted/20" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Rating badge */}
                {item.voteAverage > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-medium">
                    <Star size={9} className="text-accent-amber fill-accent-amber" />
                    {item.voteAverage.toFixed(1)}
                  </div>
                )}

                {/* Title overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <p className="text-xs font-medium leading-tight line-clamp-2">
                    {item.title}
                  </p>
                  {item.year > 0 && (
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {item.year}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
