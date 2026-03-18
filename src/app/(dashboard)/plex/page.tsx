"use client";

import { PlexStatusCard } from "@/components/plex/PlexStatusCard";
import { LibraryOverview } from "@/components/plex/LibraryOverview";
import { ActiveStreams } from "@/components/plex/ActiveStreams";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Tv } from "lucide-react";
import {
  usePlexStatus,
  usePlexLibraries,
  usePlexSessions,
} from "@/hooks/usePlexStatus";

export default function PlexPage() {
  const { data: status } = usePlexStatus();
  const { data: librariesData } = usePlexLibraries();
  const { data: sessionsData } = usePlexSessions();

  const libraries = librariesData?.libraries || [];
  const sessions = sessionsData?.sessions || [];

  if (!status) {
    return (
      <div>
        <PageHeader title="Plex" description="Plex Media Server" />
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!status.online) {
    return (
      <div>
        <PageHeader title="Plex" description="Plex Media Server" />
        <Card>
          <div className="text-center py-12">
            <Tv size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Plex Server nicht erreichbar
            </h3>
            <p className="text-sm text-muted">
              Prüfe PLEX_URL und PLEX_TOKEN in der Konfiguration.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Plex" description="Plex Media Server Übersicht" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <PlexStatusCard status={status} />
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">
              Aktive Streams
            </span>
            <span className="text-3xl font-bold">{sessions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              Bibliotheken
            </span>
            <span className="text-3xl font-bold">{libraries.length}</span>
          </div>
        </Card>
      </div>

      {/* Libraries */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted mb-4">Bibliotheken</h3>
        <LibraryOverview libraries={libraries} />
      </div>

      {/* Active Streams */}
      <ActiveStreams sessions={sessions} />
    </div>
  );
}
