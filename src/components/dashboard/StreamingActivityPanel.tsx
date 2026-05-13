"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Gauge,
  MonitorPlay,
  Pause,
  Play,
  Radio,
  ServerCog,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PlexSession } from "@/types/plex";

interface StreamingActivityPanelProps {
  sessions: PlexSession[];
  plexOnline?: boolean;
}

function formatBitrate(kbps?: number): string {
  if (!kbps || kbps <= 0) return "0 Mbit/s";
  return `${(kbps / 1000).toFixed(kbps >= 10000 ? 0 : 1)} Mbit/s`;
}

function formatRuntime(ms: number): string {
  if (!ms || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getDisplayTitle(session: PlexSession): string {
  if (session.type === "episode" && session.grandparentTitle) {
    return `${session.grandparentTitle} - ${session.title}`;
  }
  return session.title || "Unbekannter Titel";
}

function getSubtitle(session: PlexSession): string {
  const parts = [
    session.parentTitle,
    session.year ? String(session.year) : undefined,
    session.librarySectionTitle,
  ].filter(Boolean);
  return parts.join(" · ");
}

function getDecisionLabel(session: PlexSession): string {
  if (
    session.videoDecision === "transcode" ||
    session.audioDecision === "transcode"
  ) {
    const detail =
      session.videoDecision === "transcode" &&
      session.audioDecision === "transcode"
        ? "Video + Audio"
        : session.videoDecision === "transcode"
        ? "Video"
        : "Audio";
    return `Transcode · ${detail}`;
  }
  if (session.videoDecision === "copy" || session.audioDecision === "copy") {
    return "Direct Stream";
  }
  return "Direct Play";
}

function getDecisionVariant(
  session: PlexSession
): "success" | "warning" | "info" {
  if (
    session.videoDecision === "transcode" ||
    session.audioDecision === "transcode"
  ) {
    return "warning";
  }
  if (session.videoDecision === "copy" || session.audioDecision === "copy") {
    return "info";
  }
  return "success";
}

export function StreamingActivityPanel({
  sessions,
  plexOnline,
}: StreamingActivityPanelProps) {
  const totalBandwidth = sessions.reduce(
    (sum, session) => sum + (session.bandwidth || 0),
    0
  );
  const transcodes = sessions.filter(
    (session) =>
      session.videoDecision === "transcode" ||
      session.audioDecision === "transcode"
  ).length;
  const directStreams = sessions.length - transcodes;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <MonitorPlay size={16} className="text-accent-purple mr-2 inline" />
          Streaming
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={sessions.length > 0 ? "success" : "default"}>
            {sessions.length} aktiv
          </Badge>
          <Link
            href="/plex/streams"
            className="hidden sm:flex items-center gap-1 text-xs text-muted hover:text-accent-cyan transition-colors"
          >
            Details <ArrowRight size={12} />
          </Link>
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <StreamStat
          icon={<Radio size={14} />}
          label="Streams"
          value={String(sessions.length)}
        />
        <StreamStat
          icon={<Wifi size={14} />}
          label="Bandbreite"
          value={formatBitrate(totalBandwidth)}
        />
        <StreamStat
          icon={<Play size={14} />}
          label="Direct"
          value={String(directStreams)}
        />
        <StreamStat
          icon={<ServerCog size={14} />}
          label="Transcode"
          value={String(transcodes)}
          tone={transcodes > 0 ? "amber" : "muted"}
        />
      </div>

      {sessions.length === 0 ? (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] py-6 text-sm text-muted">
          <Activity size={18} className="text-muted/60" />
          {plexOnline === false
            ? "Plex ist aktuell nicht erreichbar."
            : "Keine aktiven Streams."}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <StreamSessionRow key={session.sessionKey} session={session} />
          ))}
        </div>
      )}
    </Card>
  );
}

function StreamStat({
  icon,
  label,
  value,
  tone = "purple",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "purple" | "amber" | "muted";
}) {
  const toneClass =
    tone === "amber"
      ? "text-accent-amber bg-accent-amber/10"
      : tone === "muted"
      ? "text-muted bg-white/[0.03]"
      : "text-accent-purple bg-accent-purple/10";

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneClass}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-2 text-[11px] text-muted">{label}</div>
    </div>
  );
}

function StreamSessionRow({ session }: { session: PlexSession }) {
  const isPaused = session.playerState === "paused";
  const subtitle = getSubtitle(session);
  const bandwidth = session.bandwidth || session.bitrate || 0;
  const codecLine = [
    session.videoResolution ? `${session.videoResolution}p` : undefined,
    session.videoCodec?.toUpperCase(),
    session.audioCodec?.toUpperCase(),
    session.container?.toUpperCase(),
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-accent-purple/10 text-accent-purple shadow-[0_0_12px_-4px_rgba(167,139,250,0.45)]">
            {isPaused ? <Pause size={18} /> : <Play size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">
                {getDisplayTitle(session)}
              </span>
              <Badge variant={getDecisionVariant(session)}>
                {getDecisionLabel(session)}
              </Badge>
              {isPaused && <Badge variant="default">Pausiert</Badge>}
            </div>
            {subtitle && (
              <div className="mt-0.5 truncate text-xs text-muted">
                {subtitle}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
              <span>{session.user}</span>
              <span>{session.player || "Unbekannter Player"}</span>
              {session.playerPlatform && <span>{session.playerPlatform}</span>}
              {session.playerAddress && <span>{session.playerAddress}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs lg:w-72">
          <StreamDetail
            icon={<Wifi size={12} />}
            label="Bandbreite"
            value={formatBitrate(bandwidth)}
          />
          <StreamDetail
            icon={<Gauge size={12} />}
            label="Qualitaet"
            value={codecLine.join(" · ") || "-"}
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>
            {formatRuntime(session.viewOffset)} / {formatRuntime(session.duration)}
          </span>
          <span>{Math.round(session.progress)}%</span>
        </div>
        <ProgressBar value={session.progress} color="purple" />
      </div>

      {session.transcodeProgress !== undefined && (
        <div className="mt-3 rounded-lg border border-accent-amber/10 bg-accent-amber/5 p-2">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-accent-amber">Transcoder</span>
            <span className="font-mono text-muted">
              {session.transcodeSpeed
                ? `${session.transcodeSpeed.toFixed(1)}x`
                : "aktiv"}
              {session.transcodeThrottled ? " · gedrosselt" : ""}
            </span>
          </div>
          <ProgressBar value={session.transcodeProgress} color="amber" />
        </div>
      )}
    </div>
  );
}

function StreamDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.025] p-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase text-muted">
        {icon}
        {label}
      </div>
      <div className="truncate font-medium">{value}</div>
    </div>
  );
}
