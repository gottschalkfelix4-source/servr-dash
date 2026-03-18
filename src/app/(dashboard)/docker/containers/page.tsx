"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContainerTable } from "@/components/docker/ContainerTable";
import { Spinner } from "@/components/ui/Spinner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ContainersPage() {
  const { data: serversData } = useSWR("/api/servers", fetcher);
  const servers = (serversData?.servers || []).filter(
    (s: { dockerEnabled: boolean }) => s.dockerEnabled
  );

  const [selectedServer, setSelectedServer] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const activeServer = selectedServer || servers[0]?.id || "";

  const { data: containersData, mutate } = useSWR(
    activeServer ? `/api/docker/${activeServer}/containers` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const allContainers = containersData?.containers || [];
  const containers =
    statusFilter === "all"
      ? allContainers
      : allContainers.filter(
          (c: { state: string }) => c.state === statusFilter
        );

  return (
    <div>
      <PageHeader
        title="Container"
        description="Docker Container verwalten"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">Alle</option>
              <option value="running">Laufend</option>
              <option value="exited">Gestoppt</option>
            </select>
            {servers.length > 1 && (
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
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {containers.length} Container
            {statusFilter !== "all" && ` (${statusFilter})`}
          </CardTitle>
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
    </div>
  );
}
