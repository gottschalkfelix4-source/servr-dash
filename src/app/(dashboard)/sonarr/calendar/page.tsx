"use client";

import { useMemo } from "react";
import { Calendar as CalendarIcon, ArrowLeft, Tv } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useSonarrCalendar } from "@/hooks/useSonarr";
import Link from "next/link";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getPosterUrl(
  images?: { coverType: string; remoteUrl: string }[]
): string | null {
  if (!images) return null;
  const poster = images.find((img) => img.coverType === "poster");
  return poster?.remoteUrl || null;
}

export default function CalendarPage() {
  const start = useMemo(() => new Date().toISOString(), []);
  const end = useMemo(
    () => new Date(Date.now() + 14 * 86400000).toISOString(),
    []
  );

  const { data: items, isLoading } = useSonarrCalendar(start, end);

  // Group by date
  const grouped = useMemo(() => {
    if (!items) return new Map<string, typeof items>();
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const dateKey = item.airDate || "Unbekannt";
      const existing = map.get(dateKey) || [];
      existing.push(item);
      map.set(dateKey, existing);
    }
    return new Map(
      [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
    );
  }, [items]);

  function formatDateHeading(dateStr: string): string {
    if (dateStr === "Unbekannt") return dateStr;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return "Heute";
    if (dateOnly.getTime() === tomorrow.getTime()) return "Morgen";

    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div>
      <Link
        href="/sonarr"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Zurück zu Sonarr
      </Link>

      <PageHeader
        title="Kalender"
        description="Kommende Episoden der nächsten 14 Tage"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : grouped.size === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CalendarIcon size={48} className="mx-auto text-muted mb-4" />
            <p className="text-sm text-muted">
              Keine kommenden Episoden in den nächsten 14 Tagen
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([dateStr, dateItems]) => (
            <div key={dateStr}>
              <h3 className="text-sm font-medium text-muted mb-3">
                {formatDateHeading(dateStr)}
              </h3>
              <div className="space-y-2">
                {(dateItems ?? []).map((item) => {
                  const poster = getPosterUrl(item.series?.images);
                  const epCode = `S${pad(item.seasonNumber)}E${pad(item.episodeNumber)}`;

                  return (
                    <Card
                      key={item.id}
                      hover
                      className="flex items-center gap-4"
                    >
                      {/* Poster thumbnail */}
                      <div className="shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-white/[0.02]">
                        {poster ? (
                          <img
                            src={poster}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv size={16} className="text-muted" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.series?.title || "---"}
                        </p>
                        <p className="text-xs text-muted truncate">
                          <span className="font-mono">{epCode}</span>
                          {" - "}
                          {item.title}
                        </p>
                      </div>

                      {/* Air date */}
                      {item.airDateUtc && (
                        <span className="text-xs text-muted hidden sm:block shrink-0">
                          {new Date(item.airDateUtc).toLocaleTimeString(
                            "de-DE",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      )}

                      {/* Status badge */}
                      <Badge
                        variant={item.monitored ? "success" : "default"}
                        className="shrink-0"
                      >
                        {item.monitored ? "Überwacht" : "Nicht überwacht"}
                      </Badge>
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
