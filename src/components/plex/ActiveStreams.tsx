"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Activity, Play } from "lucide-react";
import type { PlexSession } from "@/types/plex";

interface ActiveStreamsProps {
  sessions: PlexSession[];
}

export function ActiveStreams({ sessions }: ActiveStreamsProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktive Streams</CardTitle>
          <Activity size={16} className="text-muted" />
        </CardHeader>
        <div className="text-center py-8">
          <Play size={32} className="mx-auto text-muted/30 mb-2" />
          <p className="text-sm text-muted">Keine aktiven Streams</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktive Streams</CardTitle>
        <Badge variant="success">{sessions.length} aktiv</Badge>
      </CardHeader>
      <div className="space-y-3">
        {sessions.map((session) => (
          <StreamRow key={session.sessionKey} session={session} />
        ))}
      </div>
    </Card>
  );
}

function StreamRow({ session }: { session: PlexSession }) {
  const title = session.grandparentTitle
    ? `${session.grandparentTitle} — ${session.title}`
    : session.title;

  const isTranscoding = session.videoDecision === "transcode";

  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-card-solid p-3 transition-colors hover:bg-card-hover">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-accent-purple/20 bg-accent-purple/10">
        <Play size={20} className="text-accent-purple" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{title}</span>
          {session.year && (
            <span className="text-xs text-muted">({session.year})</span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="info">{session.user}</Badge>
          {session.videoResolution && (
            <Badge variant="default">{session.videoResolution}p</Badge>
          )}
          <Badge variant={isTranscoding ? "warning" : "success"}>
            {isTranscoding ? "Transcode" : "Direct Play"}
          </Badge>
          <span className="text-xs text-muted">{session.playerPlatform}</span>
        </div>
        <ProgressBar value={session.progress} color="purple" />
      </div>
    </div>
  );
}
