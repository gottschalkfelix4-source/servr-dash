"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Server, Container, Tv, Activity } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardOverview() {
  const { data: serversData } = useSWR("/api/servers", fetcher, {
    refreshInterval: 5000,
  });
  const { data: plexData } = useSWR("/api/plex/status", fetcher, {
    refreshInterval: 10000,
  });

  const servers = serversData?.servers || [];

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Link href="/servers">
          <Card hover>
            <CardHeader>
              <CardTitle>Server</CardTitle>
              <Server size={18} className="text-accent-cyan" />
            </CardHeader>
            <div className="text-3xl font-bold">{servers.length}</div>
            <p className="text-xs text-muted mt-1">Verbundene Server</p>
          </Card>
        </Link>

        <Link href="/docker">
          <Card hover>
            <CardHeader>
              <CardTitle>Docker</CardTitle>
              <Container size={18} className="text-accent-emerald" />
            </CardHeader>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs text-muted mt-1">Container aktiv</p>
          </Card>
        </Link>

        <Link href="/plex">
          <Card hover>
            <CardHeader>
              <CardTitle>Plex</CardTitle>
              <Tv size={18} className="text-accent-purple" />
            </CardHeader>
            <div className="flex items-center gap-2">
              <StatusDot
                status={plexData?.online ? "online" : "unknown"}
              />
              <span className="text-sm">
                {plexData?.name || "Nicht verbunden"}
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              {plexData?.version || "—"}
            </p>
          </Card>
        </Link>
      </div>

      {/* Server Quick View */}
      {servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Server Übersicht</CardTitle>
            <Activity size={16} className="text-muted" />
          </CardHeader>
          <div className="space-y-4">
            {servers.map(
              (server: { id: string; name: string; host: string }) => (
                <ServerQuickRow key={server.id} server={server} />
              )
            )}
          </div>
        </Card>
      )}

      {servers.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Server size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Server konfiguriert</h3>
            <p className="text-sm text-muted mb-4">
              Füge Server über die Einstellungen hinzu.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
            >
              Zu den Einstellungen
            </Link>
          </div>
        </Card>
      )}
    </div>
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
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-background transition-colors"
    >
      <StatusDot status={metrics ? "online" : "unknown"} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{server.name}</span>
          <Badge variant="info">{server.host}</Badge>
        </div>
        {metrics && (
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <span className="text-xs text-muted">CPU</span>
              <ProgressBar value={metrics.cpu} showLabel />
            </div>
            <div>
              <span className="text-xs text-muted">RAM</span>
              <ProgressBar
                value={metrics.ram.used}
                max={metrics.ram.total}
                showLabel
              />
            </div>
            <div>
              <span className="text-xs text-muted">Disk</span>
              <ProgressBar
                value={metrics.disk?.[0]?.used || 0}
                max={metrics.disk?.[0]?.total || 100}
                showLabel
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
