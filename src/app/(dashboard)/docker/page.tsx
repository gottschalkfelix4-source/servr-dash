"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContainerTable } from "@/components/docker/ContainerTable";
import { Spinner } from "@/components/ui/Spinner";
import { Container, Box } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DockerOverviewPage() {
  const { data: serversData } = useSWR("/api/servers", fetcher);
  const servers = (serversData?.servers || []).filter(
    (s: { dockerEnabled: boolean }) => s.dockerEnabled
  );

  const [selectedServer, setSelectedServer] = useState<string>("");
  const activeServer = selectedServer || servers[0]?.id || "";

  const { data: containersData, mutate } = useSWR(
    activeServer ? `/api/docker/${activeServer}/containers` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const containers = containersData?.containers || [];
  const running = containers.filter(
    (c: { state: string }) => c.state === "running"
  ).length;
  const stopped = containers.length - running;

  return (
    <div>
      <PageHeader
        title="Docker"
        description="Container-Verwaltung über alle Server"
        actions={
          servers.length > 1 ? (
            <select
              value={activeServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
            >
              {servers.map(
                (s: { id: string; name: string }) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                )
              )}
            </select>
          ) : null
        }
      />

      {servers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Container size={48} className="mx-auto text-muted mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Kein Docker-Server konfiguriert
            </h3>
            <p className="text-sm text-muted">
              Setze <code className="text-accent-cyan">dockerEnabled: true</code>{" "}
              in der Server-Konfiguration.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Container Gesamt</CardTitle>
                <Box size={16} className="text-accent-cyan" />
              </CardHeader>
              <div className="text-3xl font-bold">{containers.length}</div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Laufend</CardTitle>
              </CardHeader>
              <div className="text-3xl font-bold text-accent-emerald">
                {running}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gestoppt</CardTitle>
              </CardHeader>
              <div className="text-3xl font-bold text-accent-red">
                {stopped}
              </div>
            </Card>
          </div>

          {/* Container Table */}
          <Card>
            <CardHeader>
              <CardTitle>Container</CardTitle>
              <Badge variant="info">{containers.length} total</Badge>
            </CardHeader>
            {containersData ? (
              <ContainerTable
                containers={containers}
                serverId={activeServer}
                onRefresh={() => mutate()}
              />
            ) : (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
