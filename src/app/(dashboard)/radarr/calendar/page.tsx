"use client";

import { useMemo } from "react";
import { Calendar as CalendarIcon, Film } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRadarrCalendar } from "@/hooks/useRadarr";
import type { RadarrCalendarItem } from "@/types/radarr";

function getReleaseInfo(item: RadarrCalendarItem): {
  type: string;
  date: string;
  variant: "info" | "success" | "warning" | "default";
} | null {
  if (item.digitalRelease) {
    return { type: "Digital", date: item.digitalRelease, variant: "info" };
  }
  if (item.physicalRelease) {
    return { type: "Physisch", date: item.physicalRelease, variant: "success" };
  }
  if (item.inCinemas) {
    return { type: "Kino", date: item.inCinemas, variant: "warning" };
  }
  return null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

export default function RadarrCalendarPage() {
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: calendar, isLoading } = useRadarrCalendar(start, end);

  // Group by date
  const grouped = useMemo(() => {
    if (!calendar) return {};

    const groups: Record<string, RadarrCalendarItem[]> = {};

    for (const item of calendar) {
      const release = getReleaseInfo(item);
      if (!release) continue;

      const dateKey = release.date.split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }

    // Sort keys
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [calendar]);

  const dateKeys = Object.keys(grouped);

  return (
    <div>
      <PageHeader
        title="Kalender"
        description="Kommende Filmver\öffentlichungen (n\ächste 30 Tage)"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : dateKeys.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CalendarIcon size={48} className="mx-auto text-muted/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Keine kommenden Filme
            </h3>
            <p className="text-sm text-muted">
              In den n\ächsten 30 Tagen sind keine Filmver\öffentlichungen geplant.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                <CalendarIcon size={14} />
                {formatDate(dateKey)}
              </h3>
              <div className="space-y-2">
                {grouped[dateKey].map((item) => {
                  const release = getReleaseInfo(item);
                  if (!release) return null;

                  const poster = item.images.find(
                    (img) => img.coverType === "poster"
                  )?.remoteUrl;

                  return (
                    <Card key={item.id} hover>
                      <div className="flex items-center gap-4">
                        {/* Poster thumbnail */}
                        <div className="w-12 h-18 rounded-lg overflow-hidden bg-white/[0.02] shrink-0">
                          {poster ? (
                            <img
                              src={poster}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film size={16} className="text-muted/30" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {item.title}
                            </h4>
                            <span className="text-xs text-muted shrink-0">
                              ({item.year})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={release.variant}>
                              {release.type}
                            </Badge>
                            <span className="text-xs text-muted">
                              {formatShortDate(release.date)}
                            </span>
                            {item.hasFile && (
                              <Badge variant="success">Vorhanden</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
