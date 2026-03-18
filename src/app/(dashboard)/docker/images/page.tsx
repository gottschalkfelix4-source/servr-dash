"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Trash2 } from "lucide-react";
import type { DockerImage } from "@/types/docker";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ImagesPage() {
  const { data: serversData } = useSWR("/api/servers", fetcher);
  const servers = (serversData?.servers || []).filter(
    (s: { dockerEnabled: boolean }) => s.dockerEnabled
  );
  const [selectedServer, setSelectedServer] = useState<string>("");
  const activeServer = selectedServer || servers[0]?.id || "";

  const { data, mutate } = useSWR<{ images: DockerImage[] }>(
    activeServer ? `/api/docker/${activeServer}/images` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (imageId: string) => {
    if (!confirm("Image wirklich entfernen?")) return;
    setDeleting(imageId);
    try {
      await fetch(`/api/docker/${activeServer}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      mutate();
    } finally {
      setDeleting(null);
    }
  };

  const images = data?.images || [];

  return (
    <div>
      <PageHeader
        title="Docker Images"
        description="Images auf den Servern verwalten"
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

      <Card>
        <CardHeader>
          <CardTitle>{images.length} Images</CardTitle>
        </CardHeader>
        {data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    Repository
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    Tag
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">
                    Erstellt
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody>
                {images.map((img) => (
                  <tr
                    key={img.id}
                    className="border-b border-border/50 hover:bg-background transition-colors"
                  >
                    <td className="px-3 py-2 font-medium">{img.repository}</td>
                    <td className="px-3 py-2 text-xs font-mono text-accent-cyan">
                      {img.tag}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-muted">
                      {img.id.substring(0, 12)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      {img.created}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(img.id)}
                        disabled={deleting === img.id}
                        className="p-1.5 rounded hover:bg-accent-red/20 text-accent-red transition-colors disabled:opacity-50"
                        title="Entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
      </Card>
    </div>
  );
}
