"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { SeriesGrid } from "@/components/sonarr/SeriesGrid";
import { useSonarrSeries } from "@/hooks/useSonarr";
import Link from "next/link";

export default function SeriesPage() {
  const { data: series, isLoading } = useSonarrSeries();

  return (
    <div>
      <PageHeader
        title="Serien"
        description="Alle TV-Serien in deiner Bibliothek"
        actions={
          <Link
            href="/sonarr/series/add"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/25 transition-colors"
          >
            Serie hinzufügen
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <SeriesGrid series={series || []} />
      )}
    </div>
  );
}
