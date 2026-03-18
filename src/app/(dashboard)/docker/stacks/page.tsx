"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Layers } from "lucide-react";
import type { DockerStack } from "@/types/docker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StacksPage() {
  const { data: serversData } = useSWR("/api/servers", fetcher);
  const servers = (serversData?.servers || []).filter(
    (s: { dockerEnabled: boolean }) => s.dockerEnabled
  );
  const [selectedServer, setSelectedServer] = useState<string>("");
  const activeServer = selectedServer || servers[0]?.id || "";

  const { data } = useSWR<{ stacks: DockerStack[] }>(
    activeServer ? `/api/docker/${activeServer}/stacks` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const stacks = data?.stacks || [];

  return (
    <div>
      <PageHeader
        title="Compose Stacks"
        description="Docker Compose Projekte"
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

      {data ? (
        stacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stacks.map((stack) => (
              <Card key={stack.name} hover>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                    <Layers size={20} className="text-accent-purple" />
                  </div>
                  <div>
                    <div className="font-medium">{stack.name}</div>
                    <div className="text-xs text-muted">{stack.status}</div>
                  </div>
                </div>
                <div className="text-xs text-muted font-mono truncate">
                  {stack.configFiles}
                </div>
                <div className="mt-2">
                  <Badge
                    variant={
                      stack.status.includes("running") ? "success" : "warning"
                    }
                  >
                    {stack.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Layers size={48} className="mx-auto text-muted mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Stacks gefunden</h3>
              <p className="text-sm text-muted">
                Keine Docker Compose Projekte auf diesem Server.
              </p>
            </div>
          </Card>
        )
      ) : (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
    </div>
  );
}
