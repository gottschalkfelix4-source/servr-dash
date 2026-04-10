"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { RcloneSummaryCard } from "@/components/rclone/RcloneSummaryCard";
import {
  Server,
  Tv,
  Film,
  Clapperboard,
  Activity,
  Download,
  Calendar,
  HardDrive,
  Play,
  Eye,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatBytes } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : null));

export default function DashboardOverview() {
  // All data sources
  const { data: serversData } = useSWR("/api/servers", fetcher, {
    refreshInterval: 5000,
  });
  const { data: plexStatus } = useSWR("/api/plex/status", fetcher, {
    refreshInterval: 10000,
  });
  const { data: plexSessions } = useSWR("/api/plex/sessions", fetcher, {
    refreshInterval: 5000,
  });
  const { data: radarrMovies } = useSWR("/api/radarr/movies", fetcher, {
    refreshInterval: 30000,
  });
  const { data: radarrQueue } = useSWR("/api/radarr/queue", fetcher, {
    refreshInterval: 10000,
  });
  const { data: radarrCalendar } = useSWR(
    `/api/radarr/calendar?start=${new Date().toISOString().slice(0, 10)}&end=${getFutureDate(7)}`,
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: sonarrSeries } = useSWR("/api/sonarr/series", fetcher, {
    refreshInterval: 30000,
  });
  const { data: sonarrQueue } = useSWR("/api/sonarr/queue", fetcher, {
    refreshInterval: 10000,
  });
  const { data: sonarrCalendar } = useSWR(
    `/api/sonarr/calendar?start=${new Date().toISOString().slice(0, 10)}&end=${getFutureDate(7)}`,
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: radarrStatus } = useSWR("/api/radarr/status", fetcher, {
    refreshInterval: 60000,
  });
  const { data: sonarrStatus } = useSWR("/api/sonarr/status", fetcher, {
    refreshInterval: 60000,
  });
  const { data: indexerData } = useSWR("/api/indexer", fetcher, {
    refreshInterval: 60000,
  });
  const { data: rcloneData } = useSWR("/api/rclone/overview", fetcher, {
    refreshInterval: 10000,
  });

  const servers = serversData?.servers || [];
  const movies = radarrMovies || [];
  const series = sonarrSeries || [];
  const sessions = plexSessions?.sessions || [];
  const rQueue = radarrQueue?.records || radarrQueue || [];
  const sQueue = sonarrQueue?.records || sonarrQueue || [];
  const rCalendar = radarrCalendar || [];
  const sCalendar = sonarrCalendar || [];

  // Radarr stats
  const moviesTotal = movies.length;
  const moviesMonitored = movies.filter((m: { monitored: boolean }) => m.monitored).length;
  const moviesMissing = movies.filter(
    (m: { monitored: boolean; hasFile: boolean }) => m.monitored && !m.hasFile
  ).length;
  const moviesDiskSize = movies.reduce(
    (sum: number, m: { sizeOnDisk: number }) => sum + (m.sizeOnDisk || 0),
    0
  );

  // Sonarr stats
  const seriesTotal = series.length;
  const seriesMonitored = series.filter((s: { monitored: boolean }) => s.monitored).length;
  const episodesTotal = series.reduce(
    (sum: number, s: { statistics?: { episodeCount: number } }) =>
      sum + (s.statistics?.episodeCount || 0),
    0
  );
  const episodesHave = series.reduce(
    (sum: number, s: { statistics?: { episodeFileCount: number } }) =>
      sum + (s.statistics?.episodeFileCount || 0),
    0
  );
  const seriesDiskSize = series.reduce(
    (sum: number, s: { statistics?: { sizeOnDisk: number } }) =>
      sum + (s.statistics?.sizeOnDisk || 0),
    0
  );

  const totalQueue = rQueue.length + sQueue.length;
  const rcloneOverview = rcloneData?.overview;
  const rcloneStatus =
    !rcloneOverview || rcloneOverview.profileCount === 0
      ? "unknown"
      : rcloneOverview.offlineProfiles > 0
      ? "offline"
      : rcloneOverview.warningProfiles > 0 || rcloneOverview.mountsDegraded > 0
      ? "warning"
      : "online";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Service Status Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <ServiceStatusCard
          label="Server"
          href="/servers"
          icon={<Server size={16} />}
          color="cyan"
          status={servers.length > 0 ? "online" : "unknown"}
          value={`${servers.length}`}
          sub="verbunden"
        />
        <ServiceStatusCard
          label="Plex"
          href="/plex"
          icon={<Tv size={16} />}
          color="purple"
          status={plexStatus?.online ? "online" : "offline"}
          value={plexStatus?.online ? "Online" : "Offline"}
          sub={plexStatus?.version ? `v${plexStatus.version}` : "—"}
        />
        <ServiceStatusCard
          label="Radarr"
          href="/radarr"
          icon={<Film size={16} />}
          color="amber"
          status={radarrStatus?.version ? "online" : "offline"}
          value={radarrStatus?.version ? "Online" : "Offline"}
          sub={radarrStatus?.version ? `v${radarrStatus.version}` : "—"}
        />
        <ServiceStatusCard
          label="Sonarr"
          href="/sonarr"
          icon={<Clapperboard size={16} />}
          color="cyan"
          status={sonarrStatus?.version ? "online" : "offline"}
          value={sonarrStatus?.version ? "Online" : "Offline"}
          sub={sonarrStatus?.version ? `v${sonarrStatus.version}` : "—"}
        />
        <ServiceStatusCard
          label="Downloads"
          href="/radarr/queue"
          icon={<Download size={16} />}
          color="emerald"
          status={totalQueue > 0 ? "warning" : "online"}
          value={`${totalQueue}`}
          sub="in Queue"
        />
        <ServiceStatusCard
          label="Rclone"
          href="/rclone"
          icon={<Waypoints size={16} />}
          color="cyan"
          status={rcloneStatus}
          value={
            rcloneOverview?.profileCount
              ? rcloneStatus === "online"
                ? "Online"
                : rcloneStatus === "warning"
                ? "Warnung"
                : "Offline"
              : "—"
          }
          sub={
            rcloneOverview?.profileCount
              ? `${rcloneOverview.mountsHealthy}/${rcloneOverview.mountsTotal} Mounts`
              : "nicht konfiguriert"
          }
        />
      </div>

      {rcloneOverview?.profileCount > 0 && <RcloneSummaryCard overview={rcloneOverview} />}

      {/* ── Active Streams ── */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Play size={16} className="text-accent-emerald mr-2 inline" />
              Aktive Streams
            </CardTitle>
            <Badge variant="success">{sessions.length} aktiv</Badge>
          </CardHeader>
          <div className="space-y-2">
            {sessions.map(
              (s: {
                sessionKey: string;
                title: string;
                grandparentTitle?: string;
                user: string;
                player: string;
                videoDecision: string;
                progress: number;
              }) => (
                <div
                  key={s.sessionKey}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <Play size={14} className="text-accent-emerald flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {s.grandparentTitle
                        ? `${s.grandparentTitle} — ${s.title}`
                        : s.title}
                    </div>
                    <div className="text-xs text-muted">
                      {s.user} · {s.player} ·{" "}
                      <span className={s.videoDecision === "transcode" ? "text-accent-amber" : "text-accent-emerald"}>
                        {s.videoDecision === "transcode" ? "Transcode" : "Direct Play"}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <ProgressBar value={s.progress} />
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      {/* ── Server Metrics + Media Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Server Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Activity size={16} className="text-accent-cyan mr-2 inline" />
              Server
            </CardTitle>
            <Link href="/servers" className="text-xs text-muted hover:text-accent-cyan transition-colors flex items-center gap-1">
              Alle <ArrowRight size={12} />
            </Link>
          </CardHeader>
          {servers.length > 0 ? (
            <div className="space-y-3">
              {servers.map(
                (server: { id: string; name: string; host: string }) => (
                  <ServerQuickRow key={server.id} server={server} />
                )
              )}
            </div>
          ) : (
            <EmptyHint icon={<Server size={28} />} text="Keine Server" href="/settings" />
          )}
        </Card>

        {/* Media Library Stats */}
        <Card>
          <CardHeader>
            <CardTitle>
              <HardDrive size={16} className="text-accent-purple mr-2 inline" />
              Mediathek
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            {/* Radarr */}
            <Link href="/radarr/movies" className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Film size={14} className="text-accent-amber" />
                <span className="text-xs text-muted">Filme</span>
              </div>
              <div className="text-xl font-bold">{moviesTotal}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted">
                  <Eye size={10} className="inline mr-0.5" /> {moviesMonitored}
                </span>
                {moviesMissing > 0 && (
                  <span className="text-xs text-accent-red">
                    <AlertTriangle size={10} className="inline mr-0.5" /> {moviesMissing}
                  </span>
                )}
              </div>
              {moviesDiskSize > 0 && (
                <div className="text-xs text-muted mt-1">{formatBytes(moviesDiskSize)}</div>
              )}
            </Link>

            {/* Sonarr */}
            <Link href="/sonarr/series" className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard size={14} className="text-accent-cyan" />
                <span className="text-xs text-muted">Serien</span>
              </div>
              <div className="text-xl font-bold">{seriesTotal}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted">
                  <Eye size={10} className="inline mr-0.5" /> {seriesMonitored}
                </span>
                {episodesTotal > 0 && (
                  <span className="text-xs text-muted">
                    {episodesHave}/{episodesTotal} Ep.
                  </span>
                )}
              </div>
              {seriesDiskSize > 0 && (
                <div className="text-xs text-muted mt-1">{formatBytes(seriesDiskSize)}</div>
              )}
            </Link>

            {/* Plex Libraries */}
            <Link href="/plex" className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Tv size={14} className="text-accent-purple" />
                <span className="text-xs text-muted">Plex</span>
              </div>
              <div className="text-xl font-bold">
                {plexStatus?.online ? (
                  <StatusDot status="online" className="inline-block mr-2" />
                ) : (
                  <StatusDot status="offline" className="inline-block mr-2" />
                )}
                {plexStatus?.name || "—"}
              </div>
              <div className="text-xs text-muted mt-1">
                {sessions.length > 0
                  ? `${sessions.length} Stream${sessions.length !== 1 ? "s" : ""} aktiv`
                  : "Keine Streams"}
              </div>
            </Link>

            {/* Storage total */}
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive size={14} className="text-muted" />
                <span className="text-xs text-muted">Speicher</span>
              </div>
              <div className="text-xl font-bold">
                {formatBytes(moviesDiskSize + seriesDiskSize)}
              </div>
              <div className="text-xs text-muted mt-1">Gesamt Medien</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Download Queue ── */}
      {totalQueue > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Download size={16} className="text-accent-emerald mr-2 inline" />
              Downloads
            </CardTitle>
            <Badge variant="info">{totalQueue}</Badge>
          </CardHeader>
          <div className="space-y-2">
            {rQueue.slice(0, 5).map((item: QueueItem) => (
              <QueueRow
                key={`r-${item.id}`}
                title={item.movie?.title || item.title}
                quality={item.quality?.quality?.name}
                size={item.size}
                sizeleft={item.sizeleft}
                timeleft={item.timeleft}
                type="film"
              />
            ))}
            {sQueue.slice(0, 5).map((item: SonarrQueueItem) => (
              <QueueRow
                key={`s-${item.id}`}
                title={
                  item.series?.title
                    ? `${item.series.title} — ${item.episode?.title || item.title}`
                    : item.title
                }
                quality={item.quality?.quality?.name}
                size={item.size}
                sizeleft={item.sizeleft}
                timeleft={item.timeleft}
                type="series"
              />
            ))}
            {totalQueue > 10 && (
              <Link
                href="/radarr/queue"
                className="block text-center text-xs text-muted hover:text-accent-cyan py-2 transition-colors"
              >
                +{totalQueue - 10} weitere anzeigen
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* ── Indexer Grabs ── */}
      {indexerData?.indexers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Database size={16} className="text-accent-amber mr-2 inline" />
              Indexer
            </CardTitle>
            <Link href="/indexer" className="text-xs text-muted hover:text-accent-cyan transition-colors flex items-center gap-1">
              Details <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {indexerData.indexers.map(
              (idx: {
                name: string;
                online: boolean;
                limits?: {
                  grabCurrent: number;
                  grabMax: number;
                  apiCurrent: number;
                  apiMax: number;
                };
                user?: { grabs: number };
              }) => {
                if (!idx.online) return (
                  <div key={idx.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot status="offline" />
                      <span className="text-sm font-medium">{idx.name}</span>
                    </div>
                    <span className="text-xs text-accent-red">Offline</span>
                  </div>
                );

                const grabMax = idx.limits?.grabMax || 0;
                const grabCurrent = idx.limits?.grabCurrent || 0;
                const grabsLeft = grabMax > 0 ? grabMax - grabCurrent : null;
                const grabPercent = grabMax > 0 ? (grabCurrent / grabMax) * 100 : 0;

                return (
                  <Link key={idx.name} href="/indexer" className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusDot status="online" />
                        <span className="text-sm font-medium">{idx.name}</span>
                      </div>
                      <span className="text-xs text-muted">
                        {(idx.user?.grabs || 0).toLocaleString("de-DE")} total
                      </span>
                    </div>
                    {grabMax > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted">Downloads 24h</span>
                          <span className="text-[10px] tabular-nums font-medium">
                            <span className={grabPercent > 90 ? "text-accent-red" : grabPercent > 70 ? "text-accent-amber" : "text-accent-emerald"}>
                              {grabsLeft}
                            </span>
                            <span className="text-muted"> / {grabMax} frei</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              grabPercent > 90
                                ? "bg-gradient-to-r from-red-600 to-red-400"
                                : grabPercent > 70
                                ? "bg-gradient-to-r from-amber-600 to-amber-400"
                                : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                            }`}
                            style={{ width: `${Math.min(grabPercent, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-muted">∞ Downloads unlimited</div>
                    )}
                  </Link>
                );
              }
            )}
          </div>
        </Card>
      )}

      {/* ── Upcoming Calendar ── */}
      {(rCalendar.length > 0 || sCalendar.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar size={16} className="text-accent-amber mr-2 inline" />
              Kommende Releases
            </CardTitle>
            <span className="text-xs text-muted">Nächste 7 Tage</span>
          </CardHeader>
          <div className="space-y-2">
            {rCalendar.slice(0, 5).map(
              (item: {
                id: number;
                title: string;
                year: number;
                digitalRelease?: string;
                physicalRelease?: string;
                inCinemas?: string;
              }) => {
                const date =
                  item.digitalRelease || item.physicalRelease || item.inCinemas;
                return (
                  <CalendarRow
                    key={`r-${item.id}`}
                    title={`${item.title} (${item.year})`}
                    date={date || ""}
                    type="film"
                  />
                );
              }
            )}
            {sCalendar.slice(0, 5).map(
              (item: {
                id: number;
                title: string;
                seasonNumber: number;
                episodeNumber: number;
                airDateUtc?: string;
                series?: { title: string };
              }) => (
                <CalendarRow
                  key={`s-${item.id}`}
                  title={`${item.series?.title || ""} S${pad(item.seasonNumber)}E${pad(item.episodeNumber)} — ${item.title}`}
                  date={item.airDateUtc || ""}
                  type="series"
                />
              )
            )}
          </div>
        </Card>
      )}

    </div>
  );
}

// ── Helper Components ──

function ServiceStatusCard({
  label,
  href,
  icon,
  color,
  status,
  value,
  sub,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  status: "online" | "offline" | "warning" | "unknown";
  value: string;
  sub: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)]",
    purple: "text-accent-purple bg-accent-purple/10 shadow-[0_0_12px_-4px_rgba(167,139,250,0.3)]",
    amber: "text-accent-amber bg-accent-amber/10 shadow-[0_0_12px_-4px_rgba(245,158,11,0.3)]",
    emerald: "text-accent-emerald bg-accent-emerald/10 shadow-[0_0_12px_-4px_rgba(16,185,129,0.3)]",
  };

  return (
    <Link href={href}>
      <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
          <StatusDot status={status} />
        </div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-[11px] text-muted">{label} · {sub}</div>
      </div>
    </Link>
  );
}

function ServerQuickRow({
  server,
}: {
  server: { id: string; name: string; host: string };
}) {
  const { data } = useSWR(`/api/servers/${server.id}/metrics`, fetcher, {
    refreshInterval: 5000,
  });
  const metrics = data?.metrics;

  return (
    <Link
      href={`/servers/${server.id}`}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
    >
      <StatusDot status={metrics ? "online" : "unknown"} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-medium text-sm truncate">{server.name}</span>
          <span className="text-[11px] text-muted hidden sm:inline">{server.host}</span>
        </div>
        {metrics ? (
          <div className="grid grid-cols-3 gap-3">
            <MetricMini label="CPU" value={metrics.cpu} />
            <MetricMini
              label="RAM"
              value={Math.round(
                (metrics.ram.used / metrics.ram.total) * 100
              )}
            />
            <MetricMini
              label="Disk"
              value={Math.round(
                ((metrics.disk?.[0]?.used || 0) /
                  (metrics.disk?.[0]?.total || 1)) *
                  100
              )}
            />
          </div>
        ) : (
          <span className="text-xs text-muted">Verbinde...</span>
        )}
      </div>
    </Link>
  );
}

function MetricMini({ label, value }: { label: string; value: number }) {
  const barColor =
    value > 90 ? "bg-accent-red" : value > 70 ? "bg-accent-amber" : "bg-accent-cyan";

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted">{label}</span>
        <span className="text-[10px] font-medium">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface QueueItem {
  id: number;
  title: string;
  size: number;
  sizeleft: number;
  timeleft?: string;
  quality?: { quality: { name: string } };
  movie?: { title: string };
}

interface SonarrQueueItem extends QueueItem {
  series?: { title: string };
  episode?: { title: string; seasonNumber: number; episodeNumber: number };
}

function QueueRow({
  title,
  quality,
  size,
  sizeleft,
  timeleft,
  type,
}: {
  title: string;
  quality?: string;
  size: number;
  sizeleft: number;
  timeleft?: string;
  type: "film" | "series";
}) {
  const progress = size > 0 ? Math.round(((size - sizeleft) / size) * 100) : 0;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      {type === "film" ? (
        <Film size={14} className="text-accent-amber flex-shrink-0" />
      ) : (
        <Clapperboard size={14} className="text-accent-cyan flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{title}</div>
        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
          {quality && <span>{quality}</span>}
          <span>{formatBytes(size)}</span>
          {timeleft && (
            <span className="flex items-center gap-0.5">
              <Clock size={9} /> {timeleft}
            </span>
          )}
        </div>
      </div>
      <div className="w-16 flex-shrink-0">
        <div className="text-right text-[11px] font-medium mb-0.5">{progress}%</div>
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}

function CalendarRow({
  title,
  date,
  type,
}: {
  title: string;
  date: string;
  type: "film" | "series";
}) {
  const d = date ? new Date(date) : null;
  const isToday = d && d.toDateString() === new Date().toDateString();
  const label = d
    ? isToday
      ? "Heute"
      : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    : "—";

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      {type === "film" ? (
        <Film size={14} className="text-accent-amber flex-shrink-0" />
      ) : (
        <Clapperboard size={14} className="text-accent-cyan flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{title}</div>
      </div>
      <Badge variant={isToday ? "success" : "default"}>{label}</Badge>
    </div>
  );
}

function EmptyHint({
  icon,
  text,
  href,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center py-6 text-muted hover:text-foreground transition-colors"
    >
      {icon}
      <span className="text-sm mt-2">{text}</span>
      <span className="text-xs text-accent-cyan mt-1">Einrichten →</span>
    </Link>
  );
}

// ── Utils ──

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function getFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
