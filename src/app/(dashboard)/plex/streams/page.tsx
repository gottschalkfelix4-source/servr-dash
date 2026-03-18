"use client";

import { ActiveStreams } from "@/components/plex/ActiveStreams";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { usePlexSessions } from "@/hooks/usePlexStatus";

export default function PlexStreamsPage() {
  const { data } = usePlexSessions();
  const sessions = data?.sessions || [];

  return (
    <div>
      <PageHeader
        title="Active Streams"
        description="Alle aktiven Plex Wiedergaben"
      />
      {data ? (
        <ActiveStreams sessions={sessions} />
      ) : (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}
