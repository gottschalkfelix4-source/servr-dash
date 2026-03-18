"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { MovieGrid } from "@/components/radarr/MovieGrid";
import { useRadarrMovies } from "@/hooks/useRadarr";

export default function RadarrMoviesPage() {
  const { data: movies, isLoading } = useRadarrMovies();

  return (
    <div>
      <PageHeader
        title="Filme"
        description="Radarr Film-Bibliothek"
        actions={
          <Link
            href="/radarr/movies/add"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/25 transition-colors shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)]"
          >
            <Plus size={16} />
            Hinzuf\ügen
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <MovieGrid movies={movies || []} />
      )}
    </div>
  );
}
