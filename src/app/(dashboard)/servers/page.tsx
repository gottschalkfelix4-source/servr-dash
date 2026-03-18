"use client";

import useSWR from "swr";
import Link from "next/link";
import { ServerCard } from "@/components/server/ServerCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Server } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ServersPage() {
  const { data } = useSWR("/api/servers", fetcher, { refreshInterval: 10000 });
  const servers = data?.servers || [];

  return (
    <div>
      <PageHeader
        title="Server"
        description="SSH-verbundene Server im Überblick"
      />

      {servers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servers.map(
            (server: { id: string; name: string; host: string }) => (
              <ServerCard
                key={server.id}
                id={server.id}
                name={server.name}
                host={server.host}
              />
            )
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Server size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Keine Server konfiguriert
            </h3>
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
